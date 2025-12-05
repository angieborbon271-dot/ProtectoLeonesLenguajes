<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'api/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

function getSocioData($stid) {
    oci_fetch_all($stid, $row, 0, -1, OCI_FETCHSTATEMENT_BY_ROW);
    if (empty($row)) return null;
    
    $socio = $row[0];
    return [
        'id_socio' => $socio['ID_SOCIO'],
        'cedula' => $socio['CEDULA'],
        'nombre' => $socio['NOMBRE'],
        'apellido1' => $socio['APELLIDO1'],
        'apellido2' => $socio['APELLIDO2'] ?? '',
        'fec_nacimiento' => $socio['FEC_NACIMIENTO'],
        'genero' => $socio['GENERO'],
        'estado_civil' => $socio['ESTADO_CIVIL'],
        'profesion' => $socio['PROFESION'] ?? '',
        'telefono1' => $socio['TELEFONO1'],
        'telefono2' => $socio['TELEFONO2'] ?? '',
        'correo_electronico' => $socio['CORREO_ELECTRONICO'],
        'id_distrito' => $socio['ID_DISTRITO'],
        'direccion_exacta' => $socio['DIRECCION_EXACTA'],
        'id_tipo_socio' => $socio['ID_TIPO_SOCIO'],
        'id_estado_socio' => $socio['ID_ESTADO_SOCIO']
    ];
}

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single socio
            $sql = "SELECT * FROM SOCIOS WHERE ID_SOCIO = :id";
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':id', $id);
            oci_execute($stid);
            
            $socio = getSocioData($stid);
            if ($socio) {
                echo json_encode($socio);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Socio no encontrado']);
            }
        } else {
            // Get all socios
            $sql = "SELECT s.*, 
                           ts.NOMBRE as TIPO_SOCIO,
                           es.NOMBRE as ESTADO_SOCIO,
                           d.NOMBRE_DISTRITO as DISTRITO,
                           c.NOMBRE_CANTON as CANTON,
                           p.NOMBRE_PROVINCIA as PROVINCIA
                    FROM SOCIOS s
                    LEFT JOIN TIPOS_SOCIO ts ON s.ID_TIPO_SOCIO = ts.ID_TIPO_SOCIO
                    LEFT JOIN ESTADOS_SOCIO es ON s.ID_ESTADO_SOCIO = es.ID_ESTADO_SOCIO
                    LEFT JOIN DISTRITOS d ON s.ID_DISTRITO = d.ID_DISTRITO
                    LEFT JOIN CANTONES c ON d.ID_CANTON = c.ID_CANTON
                    LEFT JOIN PROVINCIAS p ON c.ID_PROVINCIA = p.ID_PROVINCIA
                    ORDER BY s.APELLIDO1, s.APELLIDO2, s.NOMBRE";
            $stid = oci_parse($conn, $sql);
            oci_execute($stid);
            
            $socios = [];
            while ($row = oci_fetch_assoc($stid)) {
                $socios[] = [
                    'id_socio' => $row['ID_SOCIO'],
                    'cedula' => $row['CEDULA'],
                    'nombre_completo' => trim("{$row['NOMBRE']} {$row['APELLIDO1']} {$row['APELLIDO2']}"),
                    'telefono' => $row['TELEFONO1'],
                    'correo' => $row['CORREO_ELECTRONICO'],
                    'tipo_socio' => $row['TIPO_SOCIO'],
                    'estado_socio' => $row['ESTADO_SOCIO'],
                    'distrito' => $row['DISTRITO'],
                    'canton' => $row['CANTON'],
                    'provincia' => $row['PROVINCIA']
                ];
            }
            echo json_encode($socios);
        }
        break;

    case 'POST':
        // Create new socio
        $required = ['cedula', 'nombre', 'apellido1', 'telefono1', 'correo_electronico', 
                    'id_distrito', 'direccion_exacta', 'id_tipo_socio', 'id_estado_socio'];
        
        $missing = array_diff($required, array_keys($data));
        if (!empty($missing)) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos requeridos: ' . implode(', ', $missing)]);
            break;
        }

        $sql = "INSERT INTO SOCIOS (
            CEDULA, NOMBRE, APELLIDO1, APELLIDO2, FEC_NACIMIENTO, 
            GENERO, ESTADO_CIVIL, PROFESION, TELEFONO1, TELEFONO2, 
            CORREO_ELECTRONICO, ID_DISTRITO, DIRECCION_EXACTA, ID_TIPO_SOCIO, ID_ESTADO_SOCIO
        ) VALUES (
            :cedula, :nombre, :apellido1, :apellido2, TO_DATE(:fec_nacimiento, 'YYYY-MM-DD'), 
            :genero, :estado_civil, :profesion, :telefono1, :telefono2, 
            :correo_electronico, :id_distrito, :direccion_exacta, :id_tipo_socio, :id_estado_socio
        ) RETURNING ID_SOCIO INTO :id";

        $stid = oci_parse($conn, $sql);
        
        // Bind parameters
        $id_socio = null;
        oci_bind_by_name($stid, ':id', $id_socio, 32);
        oci_bind_by_name($stid, ':cedula', $data['cedula']);
        oci_bind_by_name($stid, ':nombre', $data['nombre']);
        oci_bind_by_name($stid, ':apellido1', $data['apellido1']);
        oci_bind_by_name($stid, ':apellido2', $data['apellido2'] ?? '');
        oci_bind_by_name($stid, ':fec_nacimiento', $data['fec_nacimiento'] ?? null);
        oci_bind_by_name($stid, ':genero', $data['genero'] ?? null);
        oci_bind_by_name($stid, ':estado_civil', $data['estado_civil'] ?? null);
        oci_bind_by_name($stid, ':profesion', $data['profesion'] ?? '');
        oci_bind_by_name($stid, ':telefono1', $data['telefono1']);
        oci_bind_by_name($stid, ':telefono2', $data['telefono2'] ?? '');
        oci_bind_by_name($stid, ':correo_electronico', $data['correo_electronico']);
        oci_bind_by_name($stid, ':id_distrito', $data['id_distrito']);
        oci_bind_by_name($stid, ':direccion_exacta', $data['direccion_exacta']);
        oci_bind_by_name($stid, ':id_tipo_socio', $data['id_tipo_socio']);
        oci_bind_by_name($stid, ':id_estado_socio', $data['id_estado_socio']);

        if (oci_execute($stid)) {
            $data['id_socio'] = $id_socio;
            http_response_code(201);
            echo json_encode($data);
        } else {
            $e = oci_error($stid);
            http_response_code(500);
            echo json_encode(['error' => $e['message']]);
        }
        break;

    case 'PUT':
        // Update socio
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de socio no especificado']);
            break;
        }

        $sql = "UPDATE SOCIOS SET 
                CEDULA = :cedula,
                NOMBRE = :nombre,
                APELLIDO1 = :apellido1,
                APELLIDO2 = :apellido2,
                FEC_NACIMIENTO = TO_DATE(:fec_nacimiento, 'YYYY-MM-DD'),
                GENERO = :genero,
                ESTADO_CIVIL = :estado_civil,
                PROFESION = :profesion,
                TELEFONO1 = :telefono1,
                TELEFONO2 = :telefono2,
                CORREO_ELECTRONICO = :correo_electronico,
                ID_DISTRITO = :id_distrito,
                DIRECCION_EXACTA = :direccion_exacta,
                ID_TIPO_SOCIO = :id_tipo_socio,
                ID_ESTADO_SOCIO = :id_estado_socio
                WHERE ID_SOCIO = :id";

        $stid = oci_parse($conn, $sql);
        
        // Bind parameters
        oci_bind_by_name($stid, ':id', $id);
        oci_bind_by_name($stid, ':cedula', $data['cedula']);
        oci_bind_by_name($stid, ':nombre', $data['nombre']);
        oci_bind_by_name($stid, ':apellido1', $data['apellido1']);
        oci_bind_by_name($stid, ':apellido2', $data['apellido2'] ?? '');
        oci_bind_by_name($stid, ':fec_nacimiento', $data['fec_nacimiento'] ?? null);
        oci_bind_by_name($stid, ':genero', $data['genero'] ?? null);
        oci_bind_by_name($stid, ':estado_civil', $data['estado_civil'] ?? null);
        oci_bind_by_name($stid, ':profesion', $data['profesion'] ?? '');
        oci_bind_by_name($stid, ':telefono1', $data['telefono1']);
        oci_bind_by_name($stid, ':telefono2', $data['telefono2'] ?? '');
        oci_bind_by_name($stid, ':correo_electronico', $data['correo_electronico']);
        oci_bind_by_name($stid, ':id_distrito', $data['id_distrito']);
        oci_bind_by_name($stid, ':direccion_exacta', $data['direccion_exacta']);
        oci_bind_by_name($stid, ':id_tipo_socio', $data['id_tipo_socio']);
        oci_bind_by_name($stid, ':id_estado_socio', $data['id_estado_socio']);

        if (oci_execute($stid)) {
            if (oci_num_rows($stid) > 0) {
                $data['id_socio'] = $id;
                echo json_encode($data);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Socio no encontrado']);
            }
        } else {
            $e = oci_error($stid);
            http_response_code(500);
            echo json_encode(['error' => $e['message']]);
        }
        break;

    case 'DELETE':
        // Delete socio
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de socio no especificado']);
            break;
        }

        // Check for related records before deleting
        $check_sql = "SELECT COUNT(*) as total FROM PAGOS WHERE ID_SOCIO = :id";
        $stid = oci_parse($conn, $check_sql);
        oci_bind_by_name($stid, ':id', $id);
        oci_execute($stid);
        $row = oci_fetch_assoc($stid);
        
        if ($row['TOTAL'] > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'No se puede eliminar el socio porque tiene pagos asociados']);
            break;
        }

        $sql = "DELETE FROM SOCIOS WHERE ID_SOCIO = :id";
        $stid = oci_parse($conn, $sql);
        oci_bind_by_name($stid, ':id', $id);

        if (oci_execute($stid)) {
            if (oci_num_rows($stid) > 0) {
                http_response_code(204); // No Content
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Socio no encontrado']);
            }
        } else {
            $e = oci_error($stid);
            http_response_code(500);
            echo json_encode(['error' => $e['message']]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}

oci_close($conn);
?>