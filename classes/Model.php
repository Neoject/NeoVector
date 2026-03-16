<?php

namespace NeoVector;

use mysqli;

abstract class Model
{
    protected mysqli $db;
    protected $table;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * @return array
     */
    public function findAll(): array
    {
        $result = $this->db->query("SELECT * FROM {$this->table}");
        $rows = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
            $result->free();
        }
        return $rows;
    }

    /**
     * @param $id
     * @return false|array|null
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    /**
     * @param $column
     * @param $value
     * @return false|array|null
     */
    public function findBy($column, $value)
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$column} = ?");
        $stmt->bind_param('s', $value);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        return $row ?: null;
    }

    public function create($data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $types = str_repeat('s', count($data));

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})"
        );
        $stmt->bind_param($types, ...array_values($data));
        $stmt->execute();
        $id = $this->db->insert_id;
        $stmt->close();
        return $id;
    }

    public function update($id, $data) {
        $set = [];
        $values = [];
        $types = '';
        
        foreach ($data as $key => $value) {
            $set[] = "{$key} = ?";
            $values[] = $value;
            $types .= 's';
        }
        
        $values[] = $id;
        $types .= 'i';
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $set) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $stmt->bind_param('i', $id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
}