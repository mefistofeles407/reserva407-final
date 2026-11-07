<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/reservas.php';

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $action = $_GET['accion'] ?? 'estado';
    if (!is_string($action)) fail('Acción desconocida.', 404);
    $method = $_SERVER['REQUEST_METHOD'];
    if (($action === 'estado' && $method !== 'GET') || ($action !== 'estado' && $method !== 'POST')) fail('Método no permitido.', 405);
    $body = [];
    if ($method === 'POST') {
        // Exigir JSON mantiene estas mutaciones fuera del alcance de formularios de otros orígenes.
        if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
            fail('Envía un cuerpo JSON.', 415);
        }
        $body = json_decode(file_get_contents('php://input', false, null, 0, 65537), true);
        if (!is_array($body)) fail('JSON inválido.', 400);
    }

    session_name('reserva407_session');
    session_set_cookie_params(['path'=>'/', 'httponly'=>true, 'samesite'=>'Strict']);
    session_start(['use_strict_mode'=>true, 'use_only_cookies'=>true]);
    $db = db();
    if (in_array($action, ['registro','login','logout'], true)) reply(['ok'=>true] + auth($db, $action, $body));

    $user = currentUser($db);
    session_write_close();
    if (in_array($action, ['editar','procesar-reembolso','mesa','avanzar-reclamacion'], true) && !isAdmin($user)) {
        fail('Acceso administrativo requerido.', 403);
    }

    $db->beginTransaction();
    // Todas las operaciones del dominio adquieren el mismo conjunto de filas en orden fijo.
    $mesas = $db->query('SELECT id,ambiente,bloqueada,ocupada FROM mesas ORDER BY id FOR UPDATE')->fetchAll();
    foreach ($mesas as &$mesa) {
        $mesa['bloqueada'] = (bool) $mesa['bloqueada'];
        $mesa['ocupada'] = (bool) $mesa['ocupada'];
    }
    unset($mesa);
    reconciliar($db);
    // Una operación inválida no debe deshacer transiciones automáticas anteriores.
    $db->exec('SAVEPOINT reconciliado');
    try {
        $result = match ($action) {
            'estado' => ['datos' => estado($db, $user, $mesas)],
            'crear' => guardarReserva($db, $body, $mesas, $user),
            'editar' => guardarReserva($db, $body, $mesas, $user, cargarReserva($db, $body, $user)),
            'consultar' => (function () use ($db, $body, $user) {
                $r = cargarReserva($db, $body, $user);
                $ids = query($db, 'SELECT mesa_id FROM reserva_mesas WHERE reserva_id=? ORDER BY mesa_id', [$r['id']])->fetchAll(PDO::FETCH_COLUMN);
                $json = reservaJson($r, $ids);
                unset($json['nombre'], $json['correo'], $json['telefono']);
                return ['reserva' => $json];
            })(),
            'cancelar', 'solicitar-reembolso', 'procesar-reembolso' =>
                cambiarReserva($db, $action, cargarReserva($db, $body, $user), $user),
            'mesa' => cambiarMesa($db, $body, $mesas),
            'reclamar' => (function () use ($db, $body, $user) {
                query($db, 'INSERT INTO reclamaciones (usuario_id,reserva_codigo,asunto,detalle,fecha) VALUES (?,?,?,?,?)', [
                    $user['id'] ?? null, field($body,'reserva',32,false) ?: null, field($body,'asunto',160), field($body,'detalle',5000), date('Y-m-d'),
                ]);
                return ['mensaje' => 'Reclamación REC-' . str_pad($db->lastInsertId(), 3, '0', STR_PAD_LEFT) . ' recibida.'];
            })(),
            'avanzar-reclamacion' => (function () use ($db, $body) {
                $codigo = field($body, 'codigo', 32);
                if (!preg_match('/^REC-([0-9]+)$/D', $codigo, $m)) fail('Código de reclamación inválido.');
                $update = query($db, "UPDATE reclamaciones SET estado=IF(estado='Recibida','En revisión','Resuelta')
                    WHERE id=? AND estado<>'Resuelta'", [(int) $m[1]]);
                if (!$update->rowCount()) fail('La reclamación no tiene otro estado pendiente.', 409);
                return ['mensaje' => "Estado de $codigo actualizado."];
            })(),
            default => fail('Acción desconocida.', 404),
        };
    } catch (ApiError $error) {
        $db->exec('ROLLBACK TO SAVEPOINT reconciliado');
        $db->commit();
        throw $error;
    }
    $db->commit();
    reply(['ok'=>true] + $result);
} catch (ApiError $error) {
    reply(['ok'=>false, 'mensaje'=>$error->getMessage()], $error->getCode());
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log((string) $error);
    reply(['ok'=>false, 'mensaje'=>'No se pudo completar la operación. Comprueba Apache y MariaDB.'], 500);
}
