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
                // Obtener un estado de socio específico por ID
                $stmt = $pdo->prepare('SELECT * FROM SOCIOS WHERE id_socio = ?');
                $stmt->execute([$id]);
                $estadoSocio = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($estadoSocio) {
                    echo json_encode($estadoSocio);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Estado de socio no encontrado']);
                }
            } else {
                // Obtener todos los estados de socio
                $stmt = $pdo->query('SELECT DISTINCT estado_socio as codigo, 
                                    CASE 
                                        WHEN estado_socio = \'A\' THEN \'Activo\'
                                        WHEN estado_socio = \'I\' THEN \'Inactivo\'
                                        WHEN estado_socio = \'N\' THEN \'No miembro\'
                                        ELSE estado_socio
                                    END as descripcion
                                    FROM SOCIOS ORDER BY estado_socio');
                $estadosSocio = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Si no hay estados en la base de datos, devolver los valores por defecto
                if (empty($estadosSocio)) {
                    $estadosSocio = [
                        ['codigo' => 'A', 'descripcion' => 'Activo'],
                        ['codigo' => 'I', 'descripcion' => 'Inactivo'],
                        ['codigo' => 'N', 'descripcion' => 'No miembro']
                    ];
                }
                
                echo json_encode($estadosSocio);
            }
            break;
            
        case 'POST':
            // Crear un nuevo estado de socio (si fuera necesario en el futuro)
            http_response_code(405); // Método no permitido
            echo json_encode(['error' => 'Método no implementado']);
            break;
            
        case 'PUT':
            // Actualizar un estado de socio (si fuera necesario en el futuro)
            http_response_code(405); // Método no permitido
            echo json_encode(['error' => 'Método no implementado']);
            break;
            
        case 'DELETE':
            // Eliminar un estado de socio (si fuera necesario en el futuro)
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
