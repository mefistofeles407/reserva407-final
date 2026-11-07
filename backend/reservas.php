<?php
declare(strict_types=1);

const HORAS = ['12:00','13:00','14:00','15:00'];

function reconciliar(PDO $db): void
{
    $db->exec("UPDATE reservas r SET estado='No presentado', noPresentadoEn=UTC_TIMESTAMP(3)
        WHERE estado='Activa' AND creadaEn IS NOT NULL AND ocupacionObservadaEn IS NULL
        AND creadaEn <= TIMESTAMP(fecha,hora) + INTERVAL 315 MINUTE
        AND UTC_TIMESTAMP(3) > TIMESTAMP(fecha,hora) + INTERVAL 315 MINUTE
        AND EXISTS (SELECT 1 FROM reserva_mesas rm WHERE rm.reserva_id=r.id)
        AND NOT EXISTS (SELECT 1 FROM reserva_mesas rm JOIN mesas m ON m.id=rm.mesa_id
                        WHERE rm.reserva_id=r.id AND m.ocupada=1)");
}

function codigoReserva(int $id): string
{
    return 'RSV-' . $id;
}

function idReserva(string $codigo): int
{
    return preg_match('/^RSV-([1-9][0-9]{0,9})$/iD', $codigo, $m) ? (int) $m[1] : 0;
}

function agruparMesas(PDO $db): array
{
    $grupos = [];
    foreach ($db->query('SELECT reserva_id,mesa_id FROM reserva_mesas ORDER BY mesa_id') as $fila) {
        $grupos[$fila['reserva_id']][] = $fila['mesa_id'];
    }
    return $grupos;
}

function reservaJson(array $r, array $mesas): array
{
    foreach (['creadaEn','noPresentadoEn','ocupacionObservadaEn'] as $campo) {
        if ($r[$campo] !== null) $r[$campo] = str_replace(' ', 'T', $r[$campo]) . 'Z';
    }
    $r['codigo'] = codigoReserva((int) $r['id']);
    $r['mesas'] = $mesas;
    unset($r['id'], $r['usuario_id']);
    return $r;
}

function estado(PDO $db, ?array $user, array $mesas): array
{
    $grupos = agruparMesas($db);
    $disponibilidad = [];
    foreach ($db->query("SELECT id,fecha,hora FROM reservas WHERE estado='Activa' AND fecha >= CURRENT_DATE - INTERVAL 1 DAY") as $fila) {
        $disponibilidad[] = [
            'fecha' => $fila['fecha'], 'hora' => $fila['hora'], 'estado' => 'Activa',
            'mesas' => $grupos[$fila['id']] ?? [],
        ];
    }
    $reservas = [];
    $reclamaciones = [];
    if ($user) {
        $filas = isAdmin($user)
            ? $db->query('SELECT * FROM reservas ORDER BY fecha,hora,id')
            : query($db, 'SELECT * FROM reservas WHERE usuario_id=? ORDER BY fecha,hora,id', [$user['id']]);
        foreach ($filas as $fila) $reservas[] = reservaJson($fila, $grupos[$fila['id']] ?? []);
    }
    if (isAdmin($user)) {
        foreach ($db->query('SELECT id,reserva_codigo,asunto,detalle,estado,fecha FROM reclamaciones ORDER BY id') as $fila) {
            $fila['codigo'] = 'REC-' . str_pad((string) $fila['id'], 3, '0', STR_PAD_LEFT);
            $fila['reserva'] = $fila['reserva_codigo'] ?? 'Sin reserva';
            unset($fila['id'], $fila['reserva_codigo']);
            $reclamaciones[] = $fila;
        }
    }
    return compact('user', 'mesas', 'reservas', 'reclamaciones', 'disponibilidad');
}

function contactoNormalizado(string $contacto): string
{
    return str_contains($contacto, '@') ? mb_strtolower(trim($contacto)) : preg_replace('/[\s()+-]/u', '', $contacto);
}

function cargarReserva(PDO $db, array $body, ?array $user): array
{
    $id = idReserva(field($body, 'codigo', 32));
    $reserva = query($db, 'SELECT * FROM reservas WHERE id=?', [$id])->fetch();
    $contacto = contactoNormalizado(field($body, 'contacto', 254, false));
    if ($reserva && $contacto === '' &&
        (isAdmin($user) || ($user && (int) $reserva['usuario_id'] === (int) $user['id']))) return $reserva;
    if (!$reserva || $contacto === '' ||
        !in_array($contacto, [contactoNormalizado($reserva['correo']), contactoNormalizado($reserva['telefono'])], true)) {
        fail('No se encontró una reserva con esos datos.', 404);
    }
    return $reserva;
}

function turno(PDO $db, array $body, array $mesas, int $ignorar = 0): array
{
    $fecha = field($body, 'fecha', 10);
    $hora = field($body, 'hora', 5);
    $ambiente = field($body, 'ambiente', 12);
    $ids = $body['mesas'] ?? null;
    $fechaValida = DateTimeImmutable::createFromFormat('!Y-m-d', $fecha);
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha || $fecha < date('Y-m-d') ||
        !in_array($hora, HORAS, true) || !in_array($ambiente, ['Principal','VIP','Terraza'], true) ||
        !is_array($ids) || !array_is_list($ids) || count($ids) < 1 || count($ids) > count($mesas)) {
        fail('Elige una fecha vigente, un horario y al menos una mesa.');
    }
    foreach ($ids as $id) {
        if (!is_string($id) || !preg_match('/^[MVT][0-9]{2}$/D', $id)) fail('Identificador de mesa inválido.');
    }
    if (count($ids) !== count(array_unique($ids))) fail('Selecciona cada mesa una sola vez.');
    $asignadas = query($db, "SELECT rm.mesa_id FROM reserva_mesas rm JOIN reservas r ON r.id=rm.reserva_id
        WHERE r.fecha=? AND r.hora=? AND r.estado='Activa' AND r.id<>?", [$fecha,$hora,$ignorar])->fetchAll(PDO::FETCH_COLUMN);
    $mapa = array_column($mesas, null, 'id');
    $conflictos = [];
    foreach ($ids as $id) {
        $mesa = $mapa[$id] ?? null;
        if (!$mesa || $mesa['ambiente'] !== $ambiente || $mesa['ocupada'] || $mesa['bloqueada'] ||
            in_array($id, $asignadas, true)) $conflictos[] = $id;
    }
    if ($conflictos) fail('Mesas no disponibles: ' . implode(', ', $conflictos) . '. Retíralas y elige otras mesas.', 409);
    return [$fecha,$hora,$ambiente,$ids];
}

function guardarReserva(PDO $db, array $body, array $mesas, ?array $user, ?array $reserva = null): array
{
    $id = (int) ($reserva['id'] ?? 0);
    if ($reserva && $reserva['estado'] !== 'Activa') fail('Solo se pueden editar reservas activas.', 409);
    [$fecha,$hora,$ambiente,$ids] = turno($db, $body, $mesas, $id);
    if ($reserva) {
        query($db, 'UPDATE reservas SET fecha=?,hora=?,ambiente=? WHERE id=?', [$fecha,$hora,$ambiente,$id]);
        query($db, 'DELETE FROM reserva_mesas WHERE reserva_id=?', [$id]);
    } else {
        $nombre = field($body, 'nombre', 120);
        $correo = field($body, 'correo', 254, false);
        $telefono = field($body, 'telefono', 32, false);
        if (($body['acepta'] ?? false) !== true || ($correo === '' && contactoNormalizado($telefono) === '') ||
            ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL))) {
            fail('Ingresa un contacto válido y acepta las condiciones.');
        }
        query($db, 'INSERT INTO reservas (usuario_id,nombre,correo,telefono,fecha,hora,ambiente,adelanto,creadaEn)
            VALUES (?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3))', [
                $user['id'] ?? null,$nombre,$correo,$telefono,$fecha,$hora,$ambiente,count($ids)*100,
            ]);
        $id = (int) $db->lastInsertId();
    }
    foreach ($ids as $mesa) query($db, 'INSERT INTO reserva_mesas VALUES (?,?)', [$id,$mesa]);
    $codigo = codigoReserva($id);
    return ['codigo'=>$codigo, 'mensaje'=>$reserva ? "Reserva $codigo actualizada." : "Reserva $codigo confirmada."];
}

function cambiarReserva(PDO $db, string $action, array $r, ?array $user): array
{
    $id = (int) $r['id'];
    if ($action === 'cancelar') {
        $edad = $r['creadaEn'] === null ? INF : microtime(true) - (float) (new DateTimeImmutable($r['creadaEn'], new DateTimeZone('UTC')))->format('U.u');
        $elegible = $edad >= 0 && $edad <= 900;
        if ($r['estado'] !== 'Activa' || (!isAdmin($user) && !$elegible)) {
            fail('La reserva no se puede cancelar. El plazo es de 15 minutos desde la creación.', 409);
        }
        query($db, "UPDATE reservas SET estado='Cancelada',reembolso=? WHERE id=?", [$elegible ? 'Disponible' : null,$id]);
        return ['mensaje' => 'Reserva cancelada.'];
    }
    $solicitar = $action === 'solicitar-reembolso';
    if ($r['estado'] !== 'Cancelada' || $r['reembolso'] !== ($solicitar ? 'Disponible' : 'Pendiente')) {
        fail('La reserva no admite esta operación de reembolso.', 409);
    }
    query($db, 'UPDATE reservas SET reembolso=? WHERE id=?', [$solicitar ? 'Pendiente' : 'Procesado',$id]);
    return ['mensaje' => $solicitar ? 'Reembolso solicitado.' : 'Reembolso procesado.'];
}

function cambiarMesa(PDO $db, array $body, array $mesas): array
{
    $id = field($body, 'id', 3);
    $campo = $body['campo'] ?? null;
    $valor = $body['valor'] ?? null;
    $mesa = array_column($mesas, null, 'id')[$id] ?? null;
    if (!$mesa || !in_array($campo, ['ocupada','bloqueada'], true) || !is_bool($valor)) fail('Revisa el cambio de mesa.');
    if ($campo === 'ocupada' && $valor && $mesa['bloqueada']) fail('Desbloquea la mesa antes de ocuparla.', 409);
    if ($campo === 'ocupada' && !$valor && $mesa['ocupada']) {
        query($db, "UPDATE reservas r JOIN reserva_mesas rm ON rm.reserva_id=r.id
            SET r.ocupacionObservadaEn=COALESCE(r.ocupacionObservadaEn, UTC_TIMESTAMP(3))
            WHERE rm.mesa_id=? AND r.estado='Activa' AND r.creadaEn IS NOT NULL
            AND r.creadaEn <= TIMESTAMP(r.fecha,r.hora) + INTERVAL 315 MINUTE
            AND UTC_TIMESTAMP(3) >= TIMESTAMP(r.fecha,r.hora) + INTERVAL 5 HOUR", [$id]);
    }
    query($db, "UPDATE mesas SET $campo=? WHERE id=?", [(int) $valor,$id]);
    return ['mensaje' => "Mesa $id actualizada."];
}
