<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

$conn   = getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? $_GET['id'] : null;

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = [];

function getSocioData($stid)
{
    $rows = [];
    oci_fetch_all($stid, $rows, 0, -1, OCI_FETCHSTATEMENT_BY_ROW);
    if (empty($rows)) return null;

    $s = $rows[0];

    return [
        'id_socio'           => $s['ID_SOCIO'],
        'cedula'             => $s['CEDULA'] ?? null,              // si la usas
        'nombre'             => $s['NOMBRE_SOCIO'] ?? $s['NOMBRE'] ?? null,
        'apellido1'          => $s['APELLIDO1'] ?? null,           // si luego agregas campos
        'apellido2'          => $s['APELLIDO2'] ?? null,
        'fec_nacimiento'     => $s['FECHA_NACIMIENTO'] ?? $s['FEC_NACIMIENTO'] ?? null,
        'fec_ingreso'        => $s['FECHA_INGRESO'] ?? $s['FEC_INGRESO'] ?? null,
        'genero'             => $s['GENERO'] ?? null,
        'estado_civil'       => $s['ESTADO_CIVIL'] ?? null,
        'profesion'          => $s['PROFESION'] ?? null,
        'telefono1'          => $s['TELEFONO1'] ?? null,
        'telefono2'          => $s['TELEFONO2'] ?? null,
        'correo_electronico' => $s['CORREO_ELECTRONICO'] ?? null,
        'id_distrito'        => $s['COD_DISTRITO'] ?? $s['ID_DISTRITO'] ?? null,
        'direccion_exacta'   => $s['DESC_DIRECCION'] ?? $s['DIRECCION_EXACTA'] ?? null,
        // en tu modelo tipo y estado son char(1) en la misma tabla
        'id_tipo_socio'      => $s['TIPO_SOCIO'] ?? null,
        'id_estado_socio'    => $s['ESTADO_SOCIO'] ?? null,
        'tipo_socio'         => $s['TIPO_SOCIO'] ?? null,
        'estado_socio'       => $s['ESTADO_SOCIO'] ?? null
    ];
}

switch ($method) {

    // GET
    case 'GET':
        if ($id) {
            // detalle de un socio
            $sql  = "SELECT * FROM socios WHERE id_socio = :id";
            $stid = oci_parse($conn, $sql);
            oci_bind_by_name($stid, ':id', $id);

            if (!@oci_execute($stid)) {
                $e = oci_error($stid);
                http_response_code(500);
                echo json_encode(['error' => $e['message']]);
                break;
            }

            $socio = getSocioData($stid);
            if ($socio) {
                echo json_encode($socio);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Socio no encontrado']);
            }
            break;
        }

        $sql = "SELECT s.id_socio,
                       s.nombre_socio,
                       s.telefono1,
                       s.correo_electronico,
                       s.tipo_socio,
                       s.estado_socio,
                       s.cod_distrito,
                       d.nombre_distrito,
                       c.nombre_canton,
                       p.nombre_provincia
                FROM socios s
                LEFT JOIN distritos  d ON s.cod_distrito  = d.cod_distrito
                LEFT JOIN cantones   c ON d.cod_canton    = c.cod_canton
                LEFT JOIN provincias p ON d.cod_provincia = p.cod_provincia
                ORDER BY s.nombre_socio";

        $stid = oci_parse($conn, $sql);

        if (!@oci_execute($stid)) {
            $e = oci_error($stid);
            http_response_code(500);
            echo json_encode(['error' => $e['message']]);
            break;
        }

        $socios = [];
        while ($row = oci_fetch_assoc($stid)) {
            $socios[] = [
                'id_socio'        => $row['ID_SOCIO'],
                'cedula'          => null,
                'nombre_completo' => $row['NOMBRE_SOCIO'],
                'telefono'        => $row['TELEFONO1'],
                'correo'          => $row['CORREO_ELECTRONICO'],
                'tipo_socio'      => $row['TIPO_SOCIO'],
                'estado_socio'    => $row['ESTADO_SOCIO'],
                'distrito'        => $row['NOMBRE_DISTRITO'],
                'canton'          => $row['NOMBRE_CANTON'],
                'provincia'       => $row['NOMBRE_PROVINCIA']
            ];
        }

        echo json_encode($socios);
        break;

    // POST
    case 'POST':
        $nombre_socio   = $data['nombre_socio'] ?? ($data['nombre'] ?? null);
        $fec_nacimiento = $data['fec_nacimiento'] ?? $data['fecha_nacimiento'] ?? null;
        $fec_ingreso    = $data['fec_ingreso'] ?? $data['fecha_ingreso'] ?? null;
        $numero_socio   = $data['numero_socio'] ?? null;
        $cod_distrito   = $data['cod_distrito'] ?? $data['id_distrito'] ?? null;
        $desc_direccion = $data['desc_direccion'] ?? $data['direccion_exacta'] ?? null;
        $telefono1      = $data['telefono1'] ?? null;
        $telefono2      = $data['telefono2'] ?? null;
        // aqui van los codigos R/C/H/B/L y A/I/N
        $tipo_socio     = $data['tipo_socio'] ?? $data['id_tipo_socio'] ?? null;
        $estado_socio   = $data['estado_socio'] ?? $data['id_estado_socio'] ?? null;

        if (!$nombre_socio || !$telefono1 || !$cod_distrito || !$tipo_socio || !$estado_socio) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Faltan datos obligatorios para crear socio']);
            break;
        }

        $plsql = "BEGIN insertar_socio(
                    :p_nombre_socio,
                    :p_fecha_nacimiento,
                    :p_fecha_ingreso,
                    :p_numero_socio,
                    :p_cod_distrito,
                    :p_desc_direccion,
                    :p_telefono1,
                    :p_telefono2,
                    :p_tipo_socio,
                    :p_estado_socio
                  ); END;";

        $stid = oci_parse($conn, $plsql);
        oci_bind_by_name($stid, ':p_nombre_socio',    $nombre_socio);
        oci_bind_by_name($stid, ':p_fecha_nacimiento', $fec_nacimiento);
        oci_bind_by_name($stid, ':p_fecha_ingreso',   $fec_ingreso);
        oci_bind_by_name($stid, ':p_numero_socio',    $numero_socio);
        oci_bind_by_name($stid, ':p_cod_distrito',    $cod_distrito);
        oci_bind_by_name($stid, ':p_desc_direccion',  $desc_direccion);
        oci_bind_by_name($stid, ':p_telefono1',       $telefono1);
        oci_bind_by_name($stid, ':p_telefono2',       $telefono2);
        oci_bind_by_name($stid, ':p_tipo_socio',      $tipo_socio);
        oci_bind_by_name($stid, ':p_estado_socio',    $estado_socio);

        if (!@oci_execute($stid)) {
            $e = oci_error($stid);
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $e['message']]);
        } else {
            echo json_encode(['ok' => true, 'mensaje' => 'Socio creado correctamente']);
        }
        break;

    //actualizar_socio
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'ID de socio no especificado']);
            break;
        }

        $nombre_socio   = $data['nombre_socio'] ?? ($data['nombre'] ?? null);
        $fec_nacimiento = $data['fec_nacimiento'] ?? $data['fecha_nacimiento'] ?? null;
        $fec_ingreso    = $data['fec_ingreso'] ?? $data['fecha_ingreso'] ?? null;
        $numero_socio   = $data['numero_socio'] ?? null;
        $cod_distrito   = $data['cod_distrito'] ?? $data['id_distrito'] ?? null;
        $desc_direccion = $data['desc_direccion'] ?? $data['direccion_exacta'] ?? null;
        $telefono1      = $data['telefono1'] ?? null;
        $telefono2      = $data['telefono2'] ?? null;
        $tipo_socio     = $data['tipo_socio'] ?? $data['id_tipo_socio'] ?? null;
        $estado_socio   = $data['estado_socio'] ?? $data['id_estado_socio'] ?? null;

        if (!$nombre_socio || !$telefono1 || !$cod_distrito || !$tipo_socio || !$estado_socio) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Faltan datos obligatorios para actualizar socio']);
            break;
        }

        $plsql = "BEGIN actualizar_socio(
                    :p_id_socio,
                    :p_nombre_socio,
                    :p_fecha_nacimiento,
                    :p_fecha_ingreso,
                    :p_numero_socio,
                    :p_cod_distrito,
                    :p_desc_direccion,
                    :p_telefono1,
                    :p_telefono2,
                    :p_tipo_socio,
                    :p_estado_socio
                  ); END;";

        $stid = oci_parse($conn, $plsql);
        oci_bind_by_name($stid, ':p_id_socio',         $id);
        oci_bind_by_name($stid, ':p_nombre_socio',     $nombre_socio);
        oci_bind_by_name($stid, ':p_fecha_nacimiento', $fec_nacimiento);
        oci_bind_by_name($stid, ':p_fecha_ingreso',    $fec_ingreso);
        oci_bind_by_name($stid, ':p_numero_socio',     $numero_socio);
        oci_bind_by_name($stid, ':p_cod_distrito',     $cod_distrito);
        oci_bind_by_name($stid, ':p_desc_direccion',   $desc_direccion);
        oci_bind_by_name($stid, ':p_telefono1',        $telefono1);
        oci_bind_by_name($stid, ':p_telefono2',        $telefono2);
        oci_bind_by_name($stid, ':p_tipo_socio',       $tipo_socio);
        oci_bind_by_name($stid, ':p_estado_socio',     $estado_socio);

        if (!@oci_execute($stid)) {
            $e = oci_error($stid);
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $e['message']]);
        } else {
            echo json_encode(['ok' => true, 'mensaje' => 'Socio actualizado correctamente']);
        }
        break;

    //eliminar_socio
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'ID de socio no especificado']);
            break;
        }

        $check_sql = "SELECT COUNT(*) AS total FROM pagos WHERE id_socio = :id";
        $stid      = oci_parse($conn, $check_sql);
        oci_bind_by_name($stid, ':id', $id);
        oci_execute($stid);
        $row = oci_fetch_assoc($stid);

        if (!empty($row['TOTAL']) && $row['TOTAL'] > 0) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'No se puede eliminar el socio porque tiene pagos asociados']);
            break;
        }

        $plsql = "BEGIN eliminar_socio(:p_id_socio); END;";
        $stid  = oci_parse($conn, $plsql);
        oci_bind_by_name($stid, ':p_id_socio', $id);

        if (!@oci_execute($stid)) {
            $e = oci_error($stid);
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $e['message']]);
        } else {
            http_response_code(204);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Metodo no permitido']);
        break;
}

oci_close($conn);
