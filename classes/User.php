<?php

namespace NeoVector;

class User
{
    /**
     * @return void
     */
    public static function login(): void
    {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        $remember = isset($_POST['remember']) && $_POST['remember'] == '1';

        $result = Auth::login($username, $password, $remember);

        if ($result['success']) {
            Service::sendSuccess($result);
        } else {
            Service::sendError(401, 'Authorisation Exception', $result['message'] ?? $result['error'] ?? 'Unknown error');
        }
    }

    /**
     * Метод для регистрации, сейчас не используется
     * @return void
     */
    public static function register(): void
    {
        Auth::requireAuth();

        $username = isset($_POST['username']) ? trim((string) $_POST['username']) : '';
        $password = isset($_POST['password']) ? (string) $_POST['password'] : '';
        $role = isset($_POST['role']) ? trim((string) $_POST['role']) : 'user';

        if ($role === '') {
            $role = 'user';
        }

        if ($username === '' || $password === '') {
            Service::sendError(400, 'Missing username or password');
        }

        if (strlen($username) > 50) {
            Service::sendError(400, 'Username too long');
        }

        if (preg_match('/\s{2,}/', $username)) {
            Service::sendError(400, 'Username contains invalid spacing');
        }

        $db = Database::db();

        $stmt = $db->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->close();
            http_response_code(409);
            Service::sendJson(['error' => 'Username already taken']);
        }

        $stmt->close();

        $hash = hash('sha256', $password);
        $insert = $db->prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
        $insert->bind_param('sss', $username, $hash, $role);

        if ($insert->execute()) {
            $insert->close();
            Service::sendJson(['success' => true]);
        }

        $insert->close();
        Service::sendError(500, 'Failed to register');
    }

    /**
     * @return void
     */
    public static function logout(): void
    {
        Auth::logout();
        Service::sendSuccess(['success' => true]);
    }

    /**
     * @param string $action
     * @return void
     */
    public static function me(string $action): void
    {
        $user = Auth::getCurrentUser();

        if ($user && $action === 'me' && ($user['role'] ?? null) !== 'admin') {
            Service::sendJson(['authenticated' => false, 'error' => 'Admin access required']);
        }

        Service::sendJson($user ?? ['authenticated' => false]);
    }

    /**
     * @return void
     */
    public static function getUser(): void
    {
        Auth::requireAuth();

        $user = Auth::getCurrentUser();

        if (!$user) {
            Service::sendError(401, 'Not authenticated');
        }

        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            Service::sendError(401, 'User ID not found');
        }

        $db = Database::db();
        $stmt = $db->prepare('SELECT id, username, role, created_at FROM users WHERE id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $userData = $result->fetch_assoc();
        $stmt->close();

        if (!$userData) {
            Service::sendError(404, 'User not found');
        }

        Service::sendJson([
            'success' => true,
            'user' => [
                'id' => $userData['id'],
                'username' => $userData['username'],
                'role' => $userData['role'],
                'created_at' => $userData['created_at']
            ]
        ]);
    }

    /**
     * @return void
     */
    public static function updateProfile(): void
    {
        Auth::requireAuth();

        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            Service::sendError(401, 'User ID not found');
        }

        $newUsername = isset($_POST['username']) ? trim((string) $_POST['username']) : '';

        if ($newUsername === '') {
            Service::sendError(400, 'Username is required');
        }

        if (strlen($newUsername) > 50) {
            Service::sendError(400, 'Username too long');
        }

        if (preg_match('/\s{2,}/', $newUsername)) {
            Service::sendError(400, 'Username contains invalid spacing');
        }

        $db = Database::db();

        $stmt = $db->prepare('SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1');
        $stmt->bind_param('si', $newUsername, $userId);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->close();
            Service::sendError(409, 'Username already taken');
        }
        $stmt->close();

        $updateStmt = $db->prepare('UPDATE users SET username = ? WHERE id = ?');
        $updateStmt->bind_param('si', $newUsername, $userId);

        if ($updateStmt->execute()) {
            $_SESSION['username'] = $newUsername;
            $updateStmt->close();
            Service::sendJson(['success' => true, 'message' => 'Profile updated successfully']);
        }

        $err = $updateStmt->error;
        $updateStmt->close();

        Service::sendError(500, $err ?: 'Failed to update profile');
    }

    /**
     * @return void
     */
    public static function changePassword(): void
    {
        Auth::requireAuth();

        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            Service::sendError(401, 'User ID not found');
        }

        $currentPassword = (string) ($_POST['current_password'] ?? '');
        $newPassword = (string) ($_POST['new_password'] ?? '');
        $confirmPassword = (string) ($_POST['confirm_password'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            Service::sendError(400, 'All password fields are required');
        }

        if ($newPassword !== $confirmPassword) {
            Service::sendError(400, 'New password and confirmation do not match');
        }

        if (strlen($newPassword) < 6) {
            Service::sendError(400, 'New password must be at least 6 characters long');
        }

        if ($currentPassword === $newPassword) {
            Service::sendError(400, 'New password must be different from current password');
        }

        $db = Database::db();

        $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
        if (!$stmt) {
            Service::sendError(500, 'Database error: ' . $db->error);
        }

        $stmt->bind_param('i', $userId);

        if (!$stmt->execute()) {
            $stmt->close();
            Service::sendError(500, 'Database error: ' . $stmt->error);
        }

        $stmt->bind_result($currentHash);

        if (!$stmt->fetch()) {
            $stmt->close();
            Service::sendError(404, 'User not found');
        }

        $stmt->close();

        $currentPasswordHash = hash('sha256', $currentPassword);

        if ($currentPasswordHash !== $currentHash) {
            Service::sendError(401, 'Current password is incorrect');
        }

        $newPasswordHash = hash('sha256', $newPassword);
        $updateStmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');

        if (!$updateStmt) {
            Service::sendError(500, 'Database error: ' . $db->error);
        }

        $updateStmt->bind_param('si', $newPasswordHash, $userId);

        if ($updateStmt->execute()) {
            $updateStmt->close();
            Service::sendJson(['success' => true, 'message' => 'Password changed successfully']);
        }

        $err = $updateStmt->error;
        $updateStmt->close();
        Service::sendError(500, $err ?: 'Failed to change password');
    }

    /**
     * @return void
     */
    public static function getUsers(): void
    {
        Auth::requireAuth();

        $currentUser = Auth::getCurrentUser();

        if (!$currentUser || ($currentUser['role'] ?? null) !== 'admin') {
            Service::sendError(403, 'Admin access required');
        }

        $db = Database::db();
        $stmt = $db->prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        
        if (!$stmt) {
            Service::sendError(500, 'Database error: ' . $db->error);
        }

        if (!$stmt->execute()) {
            $stmt->close();
            Service::sendError(500, 'Database error: ' . $stmt->error);
        }

        $result = $stmt->get_result();
        $users = [];

        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'id' => (int) $row['id'],
                'username' => $row['username'],
                'role' => $row['role'],
                'created_at' => $row['created_at']
            ];
        }

        $stmt->close();
        Service::sendJson($users);
    }
}