<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Obtener datos del cuerpo de la petición para POST/PUT
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Obtener una provincia específica o todas las provincias
        if ($id) {
            $sql = "SELECT cod_provincia, nombre_provincia 
                    FROM PROVINCIAS 
                    WHERE cod_provincia = :id";
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':id', $id);
        } else {
            $sql = "SELECT cod_provincia, nombre_provincia 
                    FROM PROVINCIAS 
                    ORDER BY nombre_provincia";
            $stid = oci_parse($conn, $sql);
        }
        
        oci_execute($stid);
        $provincias = [];
        
        while ($row = oci_fetch_assoc($stid)) {
            $provincias[] = [
                'cod_provincia' => $row['COD_PROVINCIA'],
                'nombre_provincia' => $row['NOMBRE_PROVINCIA']
            ];
        }
        
        if ($id && empty($provincias)) {
            http_response_code(404);
            echo json_encode(['error' => 'Provincia no encontrada']);
        } else {
            echo json_encode($id ? $provincias[0] : $provincias);
        }
        break;

    case 'POST':
        // Crear una nueva provincia
        if (!empty($data['nombre_provincia'])) {
            // Obtener el próximo ID
            $sql = "SELECT NVL(MAX(cod_provincia), 0) + 1 as nuevo_id FROM PROVINCIAS";
            $stid = oci_parse($conn, $sql);
            oci_execute($stid);
            $row = oci_fetch_assoc($stid);
            $nuevo_id = $row['NUEVO_ID'];
            
            $sql = "INSERT INTO PROVINCIAS (cod_provincia, nombre_provincia) 
                    VALUES (:cod_provincia, :nombre_provincia)";
            $stid = oci_parse($conn, $sql);
            
            oci_bind_by_name($stid, ':cod_provincia', $nuevo_id);
            oci_bind_by_name($stid, ':nombre_provincia', $data['nombre_provincia']);
            
            if (oci_execute($stid)) {
                http_response_code(201);
                echo json_encode([
                    'cod_provincia' => $nuevo_id,
                    'nombre_provincia' => $data['nombre_provincia']
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear la provincia']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre de la provincia es requerido']);
        }
        break;

    case 'PUT':
        // Actualizar una provincia existente
        if ($id && !empty($data['nombre_provincia'])) {
            $sql = "UPDATE PROVINCIAS 
                    SET nombre_provincia = :nombre_provincia 
                    WHERE cod_provincia = :cod_provincia";
            
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':cod_provincia', $id);
            oci_bind_by_name($stid, ':nombre_provincia', $data['nombre_provincia']);
            
            if (oci_execute($stid)) {
                if (oci_num_rows($stid) > 0) {
                    echo json_encode([
                        'cod_provincia' => $id,
                        'nombre_provincia' => $data['nombre_provincia']
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Provincia no encontrada']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar la provincia']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
        }
        break;

    case 'DELETE':
        // Eliminar una provincia
        if ($id) {
            // Primero verificamos que no existan cantones asociados
            $sql_check = "SELECT COUNT(*) as total FROM CANTONES WHERE cod_provincia = :cod_provincia";
            $stid = oci_parse($conn, $sql_check);
            oci_bind_by_name($stid, ':cod_provincia', $id);
            oci_execute($stid);
            $row = oci_fetch_assoc($stid);
            
            if ($row['TOTAL'] > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'No se puede eliminar la provincia porque tiene cantones asociados']);
                break;
            }
            
            // Si no hay cantones asociados, procedemos con la eliminación
            $sql = "DELETE FROM PROVINCIAS WHERE cod_provincia = :cod_provincia";
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':cod_provincia', $id);
            
            if (oci_execute($stid)) {
                if (oci_num_rows($stid) > 0) {
                    http_response_code(204); // No Content
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Provincia no encontrada']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar la provincia']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID de provincia no especificado']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}

oci_close($conn);
?>
