<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'db.php';

// Manejar la solicitud según el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Obtener el ID de la URL si existe
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Obtener un tipo de socio específico por ID
                $stmt = $pdo->prepare('SELECT * FROM SOCIOS WHERE id_socio = ?');
                $stmt->execute([$id]);
                $tipoSocio = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($tipoSocio) {
                    echo json_encode($tipoSocio);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Tipo de socio no encontrado']);
                }
            } else {
                // Obtener todos los tipos de socio
                $stmt = $pdo->query('SELECT DISTINCT tipo_socio as codigo, 
                                    CASE 
                                        WHEN tipo_socio = \'R\' THEN \'Regulares\'
                                        WHEN tipo_socio = \'C\' THEN \'Cachorros\'
                                        WHEN tipo_socio = \'H\' THEN \'Honorarios\'
                                        WHEN tipo_socio = \'B\' THEN \'Benefactores\'
                                        WHEN tipo_socio = \'L\' THEN \'Leos\'
                                        ELSE tipo_socio
                                    END as descripcion
                                    FROM SOCIOS ORDER BY tipo_socio');
                $tiposSocio = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($tiposSocio);
            }
            break;

        case 'POST':
            // Crear un nuevo tipo de socio (si fuera necesario en el futuro)
            http_response_code(405); // Método no permitido
            echo json_encode(['error' => 'Método no implementado']);
            break;

        case 'PUT':
            // Actualizar un tipo de socio (si fuera necesario en el futuro)
            http_response_code(405); // Método no permitido
            echo json_encode(['error' => 'Método no implementado']);
            break;

        case 'DELETE':
            // Eliminar un tipo de socio (si fuera necesario en el futuro)
            http_response_code(405); // Método no permitido
            echo json_encode(['error' => 'Método no implementado']);
            break;

        case 'OPTIONS':
            // Respuesta para preflight requests
            http_response_code(200);
            break;

        default:
            http_response_code(405); // Método no permitido
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
}
