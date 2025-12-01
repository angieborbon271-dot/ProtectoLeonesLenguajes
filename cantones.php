<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'api/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Obtener datos del cuerpo de la petición para POST/PUT
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Obtener un cantón específico o todos los cantones
        if ($id) {
            $sql = "SELECT c.cod_canton, c.nombre_canton, c.cod_provincia, p.nombre_provincia 
                    FROM CANTONES c
                    JOIN PROVINCIAS p ON c.cod_provincia = p.cod_provincia
                    WHERE c.cod_canton = :id";
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':id', $id);
        } else {
            $sql = "SELECT c.cod_canton, c.nombre_canton, c.cod_provincia, p.nombre_provincia 
                    FROM CANTONES c
                    JOIN PROVINCIAS p ON c.cod_provincia = p.cod_provincia
                    ORDER BY p.nombre_provincia, c.nombre_canton";
            $stid = oci_parse($conn, $sql);
        }
        
        oci_execute($stid);
        $cantones = [];
        
        while ($row = oci_fetch_assoc($stid)) {
            $cantones[] = [
                'cod_canton' => $row['COD_CANTON'],
                'nombre_canton' => $row['NOMBRE_CANTON'],
                'cod_provincia' => $row['COD_PROVINCIA'],
                'nombre_provincia' => $row['NOMBRE_PROVINCIA']
            ];
        }
        
        if ($id && empty($cantones)) {
            http_response_code(404);
            echo json_encode(['error' => 'Cantón no encontrado']);
        } else {
            echo json_encode($id ? $cantones[0] : $cantones);
        }
        break;

    case 'POST':
        // Crear un nuevo cantón
        if (!empty($data['nombre_canton']) && !empty($data['cod_provincia'])) {
            // Obtener el próximo ID
            $sql = "SELECT NVL(MAX(cod_canton), 0) + 1 as nuevo_id FROM CANTONES";
            $stid = oci_parse($conn, $sql);
            oci_execute($stid);
            $row = oci_fetch_assoc($stid);
            $nuevo_id = $row['NUEVO_ID'];
            
            $sql = "INSERT INTO CANTONES (cod_canton, nombre_canton, cod_provincia) 
                    VALUES (:cod_canton, :nombre_canton, :cod_provincia)";
            $stid = oci_parse($conn, $sql);
            
            oci_bind_by_name($stid, ':cod_canton', $nuevo_id);
            oci_bind_by_name($stid, ':nombre_canton', $data['nombre_canton']);
            oci_bind_by_name($stid, ':cod_provincia', $data['cod_provincia']);
            
            if (oci_execute($stid)) {
                http_response_code(201);
                echo json_encode([
                    'cod_canton' => $nuevo_id,
                    'nombre_canton' => $data['nombre_canton'],
                    'cod_provincia' => $data['cod_provincia']
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear el cantón']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del cantón y la provincia son requeridos']);
        }
        break;

    case 'PUT':
        // Actualizar un cantón existente
        if ($id && !empty($data['nombre_canton']) && !empty($data['cod_provincia'])) {
            $sql = "UPDATE CANTONES 
                    SET nombre_canton = :nombre_canton, 
                        cod_provincia = :cod_provincia
                    WHERE cod_canton = :cod_canton";
            
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':cod_canton', $id);
            oci_bind_by_name($stid, ':nombre_canton', $data['nombre_canton']);
            oci_bind_by_name($stid, ':cod_provincia', $data['cod_provincia']);
            
            if (oci_execute($stid)) {
                if (oci_num_rows($stid) > 0) {
                    echo json_encode([
                        'cod_canton' => $id,
                        'nombre_canton' => $data['nombre_canton'],
                        'cod_provincia' => $data['cod_provincia']
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cantón no encontrado']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar el cantón']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
        }
        break;

    case 'DELETE':
        // Eliminar un cantón
        if ($id) {
            // Primero verificamos que no existan distritos asociados
            $sql_check = "SELECT COUNT(*) as total FROM DISTRITOS WHERE cod_canton = :cod_canton";
            $stid = oci_parse($conn, $sql_check);
            oci_bind_by_name($stid, ':cod_canton', $id);
            oci_execute($stid);
            $row = oci_fetch_assoc($stid);
            
            if ($row['TOTAL'] > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'No se puede eliminar el cantón porque tiene distritos asociados']);
                break;
            }
            
            // Si no hay distritos asociados, procedemos con la eliminación
            $sql = "DELETE FROM CANTONES WHERE cod_canton = :cod_canton";
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':cod_canton', $id);
            
            if (oci_execute($stid)) {
                if (oci_num_rows($stid) > 0) {
                    http_response_code(204); // No Content
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cantón no encontrado']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar el cantón']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID de cantón no especificado']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}

oci_close($conn);
?>