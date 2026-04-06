<?php

namespace NeoVector;

use mysqli;

class Auth
{
    private static mysqli $db;

    public static function init(mysqli $db): void
    {
        self::$db = $db;
        self::ensureUsersTable();
        self::ensureRememberTable();
        self::ensureAdminUser();
        self::autoLoginFromRememberToken();
    }

    private static function ensureUsersTable(): void
    {
        self::$db->query("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash CHAR(64) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    private static function ensureRememberTable(): void
    {
        self::$db->query("
            CREATE TABLE IF NOT EXISTS remember_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash CHAR(64) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
    }

    private static function ensureAdminUser(): void
    {
        $res = self::$db->query("SELECT id FROM users WHERE username='admin' LIMIT 1");
        if ($res->num_rows === 0) {
            $hash = hash('sha256', 'hohol1488');
            self::$db->query("
                INSERT INTO users (username, password_hash, role)
                VALUES ('admin', '$hash', 'admin')
            ");
        }
    }

    public static function isAuthenticated(): bool
    {
        return isset($_SESSION['user_id']);
    }

    public static function isAdmin(): bool
    {
        return ($_SESSION['role'] ?? null) === 'admin';
    }

    public static function login(string $username, string $password, bool $remember = false): array
    {
        $username = trim($username);

        if ($username === '' || $password === '') {
            return ['success' => false, 'error' => 'Username and password are required'];
        }

        $stmt = self::$db->prepare(
            "SELECT id, password_hash, role FROM users WHERE username=? LIMIT 1"
        );

        if ($stmt === false) {
            return ['success' => false, 'error' => 'Database prepare failed'];
        }
        
        $stmt->bind_param('s', $username);
        if (!$stmt->execute()) {
            $stmt->close();
            return ['success' => false, 'error' => 'Database execute failed'];
        }
        $stmt->bind_result($id, $hash, $role);

        $isValid = $stmt->fetch() && hash('sha256', $password) === $hash;
        $stmt->close();

        if (!$isValid) {
            return ['success' => false, 'error' => 'Invalid username or password'];
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $id;
        $_SESSION['username'] = $username;
        $_SESSION['role'] = $role;

        if ($remember) {
            self::createRememberToken($id);
        }

        session_write_close();

        return ['success' => true, 'role' => $role];
    }

    private static function createRememberToken(int $userId): void
    {
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expiresTs = time() + 60 * 60 * 24 * 30;
        $expires = date('Y-m-d H:i:s', $expiresTs);

        $stmt = self::$db->prepare("
            INSERT INTO remember_tokens (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        ");
        if ($stmt === false) {
            error_log('Auth::createRememberToken prepare failed: ' . self::$db->error);
            return;
        }
        $stmt->bind_param('iss', $userId, $hash, $expires);
        $stmt->execute();

        setcookie('remember_token', $token, [
            'expires' => $expiresTs,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }

    private static function autoLoginFromRememberToken(): void
    {
        if (self::isAuthenticated() || empty($_COOKIE['remember_token'])) {
            return;
        }

        $hash = hash('sha256', $_COOKIE['remember_token']);

        $stmt = self::$db->prepare("
            SELECT u.id, u.username, u.role
            FROM remember_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token_hash = ? AND rt.expires_at > NOW()
            LIMIT 1
        ");
        if ($stmt === false) {
            return;
        }
        $stmt->bind_param('s', $hash);
        $stmt->execute();
        $stmt->bind_result($id, $username, $role);

        if ($stmt->fetch()) {
            $_SESSION['user_id'] = $id;
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $role;
        }

        $stmt->close();
    }

    public static function logout(): void
    {
        if (!empty($_COOKIE['remember_token'])) {
            $hash = hash('sha256', $_COOKIE['remember_token']);
            $stmt = self::$db->prepare(
                "DELETE FROM remember_tokens WHERE token_hash=?"
            );
            if ($stmt !== false) {
                $stmt->bind_param('s', $hash);
                $stmt->execute();
                $stmt->close();
            }
        }

        setcookie('remember_token', '', [
            'expires' => time() - 3600,
            'path' => '/'
        ]);

        $_SESSION = [];
        session_destroy();
    }

    public static function requireAdmin(): void
    {
        if (!self::isAuthenticated() || !self::isAdmin()) {
            http_response_code(401);
            exit('Unauthorized');
        }
    }

    public static function requireAuth(): void
    {
        if (!self::isAuthenticated()) {
            http_response_code(401);
            exit('Unauthorized');
        }
    }

    public static function getCurrentUser(): ?array
    {
        if (!self::isAuthenticated()) {
            return null;
        }

        return [
            'authenticated' => true,
            'id'       => $_SESSION['user_id'],
            'username' => $_SESSION['username'] ?? null,
            'role'     => $_SESSION['role'] ?? null
        ];
    }
}