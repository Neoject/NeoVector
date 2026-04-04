<?php

namespace NeoVector;

use mysqli;
use PDO;
use Exception;

class Database
{
    private static ?Database $instance = null;
    private mysqli $connection;
    private PDO $pdo;

    /**
     * @throws Exception
     */
    private function __construct()
    {
        global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;

        $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";

        $this->connection = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

        if ($this->connection->connect_errno) {
            throw new Exception('DB connection failed: ' . $this->connection->connect_error);
        }

        $this->connection->set_charset('utf8mb4');

        $this->pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

    /**
     * @return Database
     */
    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }

        return self::$instance;
    }

    /**
     * @return mysqli
     */
    public function getConnection(): mysqli
    {
        return $this->connection;
    }

    /**
     * Shortcut: returns the mysqli connection directly.
     * @return mysqli
     */
    public static function db(): mysqli
    {
        return self::getInstance()->getConnection();
    }

    /**
     * @param $sql
     * @param array $params
     * @return int
     */
    public static function execute($sql, array $params = []): int
    {
        $stmt = self::getInstance()->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * @param  string $table
     * @param  array  $values
     * <code>[ key => value ]</code>
     * @return bool
     */
    public static function insert(string $table, array $values): bool
    {
        $columns = implode(', ', array_keys($values));
        $placeholders = implode(', ', array_fill(0, count($values), '?'));

        $sql = 'INSERT INTO ' . $table . ' (' . $columns . ') VALUES (' . $placeholders . ')';

        $stmt = Database::db()->prepare($sql);

        if ($stmt->execute(array_values($values))) {
            return true;
        }

        return false;
    }

    /**
     * @param  string $table
     * @param  array  $values
     * <code>[ key => value ]</code>
     * @param  array  $where
     * <code>[ key => value ]</code>
     * @return bool
     */
    public static function update(string $table, array $values, array $where): bool
    {
        $set = implode(', ', array_map(fn($col) => $col . ' = ?', array_keys($values)));
        $conditions = implode(' AND ', array_map(fn($col) => $col . ' = ?', array_keys($where)));

        $sql = 'UPDATE ' . $table . ' SET ' . $set . ' WHERE ' . $conditions;

        $stmt = Database::db()->prepare($sql);

        if ($stmt->execute([...array_values($values), ...array_values($where)])) {
            return true;
        }

        return false;
    }

    /**
     * @param  string $table
     * @param  array  $where
     * <code>[ key => value ]</code>
     * @return bool
     */
    public static function delete(string $table, array $where): bool
    {
        $conditions = implode(' AND ', array_map(fn($col) => $col . ' = ?', array_keys($where)));

        $sql = 'DELETE FROM ' . $table . ' WHERE ' . $conditions;

        $stmt = Database::db()->prepare($sql);

        if (!$stmt->error) {
            return true;
        }

        return false;
    }

    public static function getList(string $table, array $filter = [], array $order = []): array
    {
        $table = '`' . str_replace('`', '``', $table) . '`';
        $sql = "SELECT * FROM $table";

        $params = [];

        if (!empty($filter)) {
            $conditions = [];

            foreach ($filter as $column => $value) {
                $conditions[] = "`$column` = ?";
                $params[] = $value;
            }

            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        if (!empty($order)) {
            $orderParts = [];

            foreach ($order as $column => $direction) {
                $direction = strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC';
                $orderParts[] = "`$column` $direction";
            }

            $sql .= ' ORDER BY ' . implode(', ', $orderParts);
        }

        $pdo = self::getInstance()->pdo;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }
}