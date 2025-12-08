<?php
require_once 'db.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$conn   = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT id_estado_socio,
                 nombre_estado
          FROM estados_socio
          ORDER BY id_estado_socio";

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

    $estados = [];
    while ($row = oci_fetch_assoc($stid)) {
        $estados[] = $row;
    }

    echo json_encode($estados);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo no permitido']);
