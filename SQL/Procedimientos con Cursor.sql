--Listar provincias usando cursor
CREATE OR REPLACE PROCEDURE listar_provincias
IS
    CURSOR cur_provincias IS
        SELECT cod_provincia, nombre_provincia
        FROM PROVINCIAS
        ORDER BY nombre_provincia;

    v_cod   PROVINCIAS.cod_provincia%TYPE;
    v_nom   PROVINCIAS.nombre_provincia%TYPE;
BEGIN
    OPEN cur_provincias;
    LOOP
        FETCH cur_provincias INTO v_cod, v_nom;
        EXIT WHEN cur_provincias%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE('Provincia: ' || v_cod || ' - ' || v_nom);
    END LOOP;
    CLOSE cur_provincias;
END listar_provincias;
/

--Mostrar cantones por provincia
CREATE OR REPLACE PROCEDURE listar_cantones_por_provincia (
    p_cod_provincia IN CANTONES.cod_provincia%TYPE
)
IS
    CURSOR cur_cantones IS
        SELECT cod_canton, nombre_canton
        FROM CANTONES
        WHERE cod_provincia = p_cod_provincia;

    v_cod   CANTONES.cod_canton%TYPE;
    v_nom   CANTONES.nombre_canton%TYPE;
BEGIN
    OPEN cur_cantones;
    LOOP
        FETCH cur_cantones INTO v_cod, v_nom;
        EXIT WHEN cur_cantones%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE('Cantón: ' || v_cod || ' - ' || v_nom);
    END LOOP;
    CLOSE cur_cantones;
END listar_cantones_por_provincia;
/

--Mostrar socios activos
CREATE OR REPLACE PROCEDURE listar_socios_activos
IS
    CURSOR cur_socios IS
        SELECT id_socio, nombre_socio, estado_socio
        FROM SOCIOS
        WHERE estado_socio = 'A';

    v_id   SOCIOS.id_socio%TYPE;
    v_nom  SOCIOS.nombre_socio%TYPE;
    v_est  SOCIOS.estado_socio%TYPE;
BEGIN
    OPEN cur_socios;
    LOOP
        FETCH cur_socios INTO v_id, v_nom, v_est;
        EXIT WHEN cur_socios%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE('Socio: ' || v_id || ' - ' || v_nom || ' (' || v_est || ')');
    END LOOP;
    CLOSE cur_socios;
END listar_socios_activos;
/

--Transacciones por año de pago
CREATE OR REPLACE PROCEDURE listar_transacciones_an (
    p_an_pago IN TRANSACCIONES.an_pago%TYPE
)
IS
    CURSOR cur_trans IS
        SELECT id_transaccion, fec_transaccion, monto_colones, monto_dolares
        FROM TRANSACCIONES
        WHERE an_pago = p_an_pago;

    v_id    TRANSACCIONES.id_transaccion%TYPE;
    v_fec   TRANSACCIONES.fec_transaccion%TYPE;
    v_col   TRANSACCIONES.monto_colones%TYPE;
    v_dol   TRANSACCIONES.monto_dolares%TYPE;
BEGIN
    OPEN cur_trans;
    LOOP
        FETCH cur_trans INTO v_id, v_fec, v_col, v_dol;
        EXIT WHEN cur_trans%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE('Transacción: ' || v_id || ' - Fecha: ' || v_fec ||
                             ' - Colones: ' || v_col || ' - Dólares: ' || NVL(v_dol,0));
    END LOOP;
    CLOSE cur_trans;
END listar_transacciones_anio;
/

