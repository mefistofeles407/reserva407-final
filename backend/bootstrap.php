<?php
declare(strict_types=1);

date_default_timezone_set('America/Lima');

final class ApiError extends RuntimeException {}

function db(): PDO
{
    $db = new PDO('mysql:host=127.0.0.1;port=3307;dbname=reserva407;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $db->exec("SET time_zone = '+00:00'");
    return $db;
}

function query(PDO $db, string $sql, array $params = []): PDOStatement
{
    $statement = $db->prepare($sql);
    $statement->execute($params);
    return $statement;
}

function fail(string $message, int $status = 422): never
{
    throw new ApiError($message, $status);
}

function field(array $data, string $key, int $max, bool $required = true): string
{
    $raw = $data[$key] ?? '';
    if (!is_string($raw)) fail('Revisa los datos ingresados.');
    $value = trim($raw);
    if (($required && $value === '') || mb_strlen($value) > $max) fail("Revisa el campo {$key}.");
    return $value;
}

function reply(array $result, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function currentUser(PDO $db): ?array
{
    $id = $_SESSION['usuario'] ?? null;
    return $id ? (query($db, 'SELECT id,nombre,correo,telefono,rol FROM usuarios WHERE id=?', [$id])->fetch() ?: null) : null;
}

function isAdmin(?array $user): bool
{
    return ($user['rol'] ?? null) === 'admin';
}

function auth(PDO $db, string $action, array $body): array
{
    if ($action === 'logout') {
        $_SESSION = [];
        setcookie(session_name(), '', ['expires' => 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
        session_destroy();
        return ['mensaje' => 'Sesión cerrada.', 'usuario' => null];
    }
    $correo = mb_strtolower(field($body, 'correo', 254));
    $clave = $body['clave'] ?? null;
    if (!is_string($clave) || strlen($clave) > 72 || str_contains($clave, "\0")) fail('Revisa la contraseña.');
    if ($action === 'registro') {
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || strlen($clave) < 8) {
            fail('Ingresa un correo válido y una contraseña de al menos 8 caracteres.');
        }
        try {
            query($db, 'INSERT INTO usuarios (nombre,correo,telefono,password_hash) VALUES (?,?,?,?)', [
                field($body, 'nombre', 120), $correo, field($body, 'telefono', 32),
                password_hash($clave, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $error) {
            if (($error->errorInfo[1] ?? null) === 1062) fail('Ese correo ya está registrado.', 409);
            throw $error;
        }
        $id = (int) $db->lastInsertId();
    } else {
        $user = query($db, 'SELECT id,rol,password_hash FROM usuarios WHERE correo=?', [$correo])->fetch();
        if (!$user || !password_verify($clave, $user['password_hash']) || $user['rol'] !== ($body['rol'] ?? 'cliente')) {
            fail('Credenciales inválidas.', 401);
        }
        $id = $user['id'];
    }
    session_regenerate_id(true);
    $_SESSION['usuario'] = $id;
    return ['mensaje' => $action === 'registro' ? 'Cuenta creada.' : 'Sesión iniciada.', 'usuario' => currentUser($db)];
}
