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

## Columnas extra
Si pegas o cargas con encabezados y agregas columnas nuevas al final (ej. "Domicilio casa"), se guardan solas y aparecen en **Más datos** al abrir la cuenta. Solo hace falta actualizar la app si se quiere que una columna haga algo especial.

## Versiones
- **1.6.0** — Color por tramo de atraso: 🟢 Del día, 🟡 Mora 1-7, 🔴 Mora 8+ (franja y etiqueta en la tarjeta) y filtros por tramo.
- **1.5.0** — Lee filas pegadas desde WhatsApp en el celular aunque los tabuladores lleguen como espacios (Excel en compu → WhatsApp con Ctrl+Shift+V → copiar en el celular → pegar en la app).
- **1.4.0** — Borrar cuenta desde su detalle; Deshacer última carga (barra al guardar y en Ajustes); Borrar todas las cuentas; el pegado corrido o sin tabuladores se marca como error y no se guarda.
- **1.3.0** — Nombres en pantalla como Nombre Propio; mensajes más naturales: saludo según la hora ({saludo}), varias versiones por plantilla (separadas con ---) elegidas al azar, sin "él/ella".
- **1.2.0** — 4 plantillas de WhatsApp: titular al corriente / en atraso y tercera persona al corriente / en atraso (se elige sola según de quién es el teléfono en uso). A terceros nunca se menciona adeudo.
- **1.1.0** — Agregar teléfonos (el nuevo se usa para Llamar/WhatsApp, los anteriores se conservan); llamada con 10 dígitos sin +52; tarjetas compactas (tocar el nombre para ver todo); columnas extra automáticas.
- **1.0.0** — Primera versión.

## Desarrollo
- `index.html` (app completa, sin librerías externas), `sw.js` (red primero), `manifest.json`, `icons/`.
- Pruebas: `node tests/core.test.mjs`
- Cada versión: subir `APP_VERSION` en `index.html` y `CACHE` en `sw.js`. Si cambia la forma de los datos, subir `SCHEMA` y agregar la transformación en `migrate()` (sin borrar nada).
