# Reglas del repo cobranza-gp

- NUNCA poner datos reales de clientes (nombres, teléfonos, direcciones, coordenadas, IDs) en código, ejemplos, pruebas ni commits. Solo datos inventados (IDs 9000000xx, teléfonos 00000000xx).
- La clave de localStorage `cobranza_gp_datos` NO se cambia jamás.
- Cada actualización: subir `APP_VERSION` (index.html) y `CACHE` (sw.js) al mismo número; actualizar la tabla de versiones del README si aplica.
- Si cambia la estructura de datos: subir `SCHEMA` y agregar la transformación en `migrate()`; nunca borrar campos ni cuentas. loadStore() guarda copia `cobranza_gp_datos_antes_vN` antes de migrar.
- Sin librerías externas ni llamadas de red. Únicas salidas: wa.me, tel:, Google Maps.
- WhatsApp: no cambiar la lógica de `waUrl()` (wa.me/52 + 10 dígitos, primer nombre, plantilla Mora vs Del día, sin montos).
- Correr `node tests/core.test.mjs` antes de cada commit. Mensajes de commit en español.
