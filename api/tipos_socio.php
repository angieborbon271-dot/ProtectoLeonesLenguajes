<?php
require_once 'db.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$conn   = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT id_tipo_socio,
                 nombre_tipo_socio
          FROM tipos_socio
          ORDER BY id_tipo_socio";

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

    $tipos = [];
    while ($row = oci_fetch_assoc($stid)) {
        $tipos[] = $row;
    }

    echo json_encode($tipos);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo no permitido']);
