# Cobranza GP

App personal para dar seguimiento a cuentas de cobranza que atiendo directamente.

**Dirección:** https://jose2811.github.io/cobranza-gp/

## Privacidad
- Este repositorio **no contiene datos de clientes**. Todo lo que hay en `ejemplos/` y `tests/` es inventado.
- Las cuentas se guardan solo en el teléfono (localStorage, clave `cobranza_gp_datos`) y nunca se envían a ningún servidor.
- Las únicas salidas son los enlaces de WhatsApp, teléfono y Google Maps.
- No subir aquí respaldos (`.json`) ni archivos de cartera (`.csv`/`.txt`).

## Uso rápido
1. **＋ Agregar** → pega filas copiadas de Excel (con o sin encabezados) o **Cargar archivo** (.csv / .txt) → **Revisar** → **Guardar**.
2. En cada cuenta: Llamar, WhatsApp, Ir al punto, Copiar dirección, Gestión, Compromiso, Historial y Archivar.
3. **⚙︎ Ajustes**: nombre y textos de WhatsApp, descargar / restaurar respaldo.
4. Para instalarla: abrir la dirección en Chrome → menú ⋮ → *Agregar a pantalla principal*.

Columnas: `SafiCreditoID | Status | Oficina | Cliente | Saldo insoluto | Saldo en atraso | Multa | Dias de atraso | Num. Pago | Telefono | Latitud | Longitud | Direccion del negocio`

## Desarrollo
- `index.html` (app completa, sin librerías externas), `sw.js` (red primero), `manifest.json`, `icons/`.
- Pruebas: `node tests/core.test.mjs`
- Cada versión: subir `APP_VERSION` en `index.html` y `CACHE` en `sw.js`. Si cambia la forma de los datos, subir `SCHEMA` y agregar la transformación en `migrate()` (sin borrar nada).
