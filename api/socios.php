<?php
require_once 'db.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$conn   = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// GET: listar socios
if ($method === 'GET') {
  $sql = "SELECT s.id_socio,
                   s.nombre_socio,
                   s.fecha_nacimiento,
                   s.fecha_ingreso,
                   s.numero_socio,
                   s.cod_distrito,
                   s.desc_direccion,
                   s.telefono1,
                   s.telefono2,
                   s.tipo_socio,
                   s.estado_socio,
                   d.nombre_distrito,
                   c.nombre_canton,
                   p.nombre_provincia
            FROM socios s
            LEFT JOIN distritos d  ON s.cod_distrito = d.cod_distrito
            LEFT JOIN cantones  c  ON d.cod_canton   = c.cod_canton
            LEFT JOIN provincias p ON c.cod_provincia = p.cod_provincia
            ORDER BY s.id_socio";

  $stid = oci_parse($conn, $sql);

  if (!@oci_execute($stid)) {
    $e = oci_error($stid);
    http_response_code(500);
    echo json_encode([
      'ok'      => false,
      'mensaje' => $e['message']
    ]);
    exit;
  }

  $socios = [];
  while ($row = oci_fetch_assoc($stid)) {
    $socios[] = $row; // devuelve claves en MAYUSCULA
  }

  echo json_encode($socios);
  exit;
}

// POST: crear / actualizar / eliminar
if ($method === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  if (!is_array($data)) $data = [];

  $accion          = $data['accion']          ?? '';
  $id_socio        = $data['id_socio']        ?? null;
  $nombre_socio    = $data['nombre_socio']    ?? null;
  $fecha_nacimiento = $data['fecha_nacimiento'] ?? null;
  $fecha_ingreso   = $data['fecha_ingreso']   ?? null;
  $numero_socio    = $data['numero_socio']    ?? null;
  $cod_distrito    = $data['cod_distrito']    ?? null;
  $desc_direccion  = $data['desc_direccion']  ?? null;
  $telefono1       = $data['telefono1']       ?? null;
  $telefono2       = $data['telefono2']       ?? null;
  $tipo_socio      = $data['tipo_socio']      ?? null;
  $estado_socio    = $data['estado_socio']    ?? null;

  if ($fecha_nacimiento === '') $fecha_nacimiento = null;
  if ($fecha_ingreso === '')    $fecha_ingreso    = null;
  if ($desc_direccion === '')   $desc_direccion   = null;
  if ($telefono2 === '')        $telefono2       = null;

  // CREAR
  if ($accion === 'crear') {
    if (!$nombre_socio || !$fecha_ingreso || !$numero_socio || !$cod_distrito || !$telefono1 || !$tipo_socio || !$estado_socio) {
      http_response_code(400);
      echo json_encode([
        'ok'      => false,
        'mensaje' => 'Faltan datos obligatorios'
      ]);
      exit;
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
    oci_bind_by_name($stid, ':p_fecha_nacimiento', $fecha_nacimiento);
    oci_bind_by_name($stid, ':p_fecha_ingreso',   $fecha_ingreso);
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
      echo json_encode([
        'ok'      => false,
        'mensaje' => $e['message']
      ]);
    } else {
      echo json_encode([
        'ok'      => true,
        'mensaje' => 'Socio creado correctamente'
      ]);
    }
    exit;
  }

  // ACTUALIZAR
  if ($accion === 'actualizar') {
    if (!$id_socio) {
      http_response_code(400);
      echo json_encode([
        'ok'      => false,
        'mensaje' => 'Falta id_socio para actualizar'
      ]);
      exit;
    }

    if (!$nombre_socio || !$fecha_ingreso || !$numero_socio || !$cod_distrito || !$telefono1 || !$tipo_socio || !$estado_socio) {
      http_response_code(400);
      echo json_encode([
        'ok'      => false,
        'mensaje' => 'Faltan datos obligatorios'
      ]);
      exit;
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
    oci_bind_by_name($stid, ':p_id_socio',        $id_socio);
    oci_bind_by_name($stid, ':p_nombre_socio',    $nombre_socio);
    oci_bind_by_name($stid, ':p_fecha_nacimiento', $fecha_nacimiento);
    oci_bind_by_name($stid, ':p_fecha_ingreso',   $fecha_ingreso);
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
      echo json_encode([
        'ok'      => false,
        'mensaje' => $e['message']
      ]);
    } else {
      echo json_encode([
        'ok'      => true,
        'mensaje' => 'Socio actualizado correctamente'
      ]);
    }
    exit;
  }

  // ELIMINAR
  if ($accion === 'eliminar') {
    if (!$id_socio) {
      http_response_code(400);
      echo json_encode([
        'ok'      => false,
        'mensaje' => 'Falta id_socio para eliminar'
      ]);
      exit;
    }

    // si quieres validar pagos asociados, aqui se puede hacer con un SELECT COUNT(*)

    $plsql = "BEGIN eliminar_socio(:p_id_socio); END;";
    $stid  = oci_parse($conn, $plsql);
    oci_bind_by_name($stid, ':p_id_socio', $id_socio);

    if (!@oci_execute($stid)) {
      $e = oci_error($stid);
      http_response_code(400);
      echo json_encode([
        'ok'      => false,
        'mensaje' => $e['message']
      ]);
    } else {
      echo json_encode([
        'ok'      => true,
        'mensaje' => 'Socio eliminado correctamente'
      ]);
    }
    exit;
  }

  http_response_code(400);
  echo json_encode(['ok' => false, 'mensaje' => 'Accion no reconocida']);
  exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'mensaje' => 'Metodo no permitido']);
