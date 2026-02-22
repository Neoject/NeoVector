<?php

namespace NeoVision;

use mysqli;

class Auth
{
    private mysqli $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->ensureUsersTable();
        $this->ensureAdminUser();
    }

    /**
     * @return void
     */
    private function ensureUsersTable(): void
    {
        $createUsersTableSQL = "CREATE TABLE IF NOT EXISTS `users` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `username` varchar(50) NOT NULL,
            `password_hash` varchar(64) NOT NULL,
            `role` varchar(20) NOT NULL DEFAULT 'user',
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `username_unique` (`username`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        $this->db->query($createUsersTableSQL);
    }

    /**
     * @return void
     */
    private function ensureAdminUser(): void
    {
        $stmt = $this->db->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
        $adminName = 'admin';
        $stmt->bind_param('s', $adminName);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows === 0) {
            $stmt->close();
            $passwordHash = hash('sha256', 'hohol1488');
            $role = 'admin';
            $insert = $this->db->prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
            $insert->bind_param('sss', $adminName, $passwordHash, $role);
            $insert->execute();
            $insert->close();
        } else {
            $stmt->close();
        }
    }

    /**
     * @return mixed
     */
    public static function getUserId(): int
    {
        return (int) $_SESSION['user_id'];
    }

    /**
     * @return bool
     */
    public function isAuthenticated(): bool
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * @return bool
     */
    public function isAdmin(): bool
    {
        return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
    }

    /**
     * @param string $username
     * @param string $password
     * @param bool $remember
     * @return array
     * @throws \Random\RandomException
     */
    public function login(string $username, string $password, bool $remember = false): array
    {
        $uid = null;
        $passHash = null;
        $role = '';

        $stmt = $this->db->prepare('SELECT id, password_hash, role FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->bind_result($uid, $passHash, $role);

        if ($stmt->fetch() && hash('sha256', $password) === $passHash) {
            $_SESSION['user_id'] = $uid;
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $role;

            if ($remember) {
                $token = bin2hex(random_bytes(32));
                $this->setRememberCookie($token);
            }

            $stmt->close();

            return ['success' => true, 'role' => $role];
        }

        $stmt->close();

        return ['success' => false, 'error' => 'Invalid credentials'];
    }

    /**
     * @return void
     */
    public function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        session_destroy();
        $this->clearRememberCookie();
    }

    /**
     * @return array|null
     */
    public function getCurrentUser(): ?array
    {
        if (!$this->isAuthenticated()) {
            return null;
        }

        return [
            'authenticated' => true,
            'username' => $_SESSION['username'] ?? null,
            'role' => $_SESSION['role'] ?? null
        ];
    }

    /**
     * @param $token
     * @param int $days
     * @return void
     */
    private function setRememberCookie($token, int $days = 30): void
    {
        $expire = time() + ($days * 24 * 60 * 60);
        setcookie('remember_token', $token, [
            'expires' => $expire,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }

    /**
     * @return void
     */
    private function clearRememberCookie(): void
    {
        setcookie('remember_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }

    /**
     * Static auth guard: checks admin authentication, sends 401 on failure.
     * @return void
     */
    public static function requireAuth(): void
    {
        $auth = new self(Database::db());
        if (!$auth->isAuthenticated() || !$auth->isAdmin()) {
            Service::sendError(401, 'Unauthorized');
        }
    }
}