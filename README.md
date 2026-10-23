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

Columnas: `SafiCreditoID | Status | Oficina | Cliente | Saldo insoluto | Saldo en atraso | Multa | Dias de atraso | Num. Pago | Telefono | Latitud | Longitud | Direccion del negocio | Fecha de vencimiento (opcional)`

## Columnas extra
Si pegas o cargas con encabezados y agregas columnas nuevas al final (ej. "Domicilio casa"), se guardan solas y aparecen en **Más datos** al abrir la cuenta. Solo hace falta actualizar la app si se quiere que una columna haga algo especial.

## Versiones
- **1.13.0** — "📍 Mandarme ubicación por WhatsApp": nombre, dirección, enlace de Google Maps con coordenadas exactas y coordenadas para pegar; número personal configurable en Ajustes.
- **1.12.0** — Detecta cambios de saldo al recargar: 💸 abono / ⬆ subió (multa y/o cuota nueva) / ↕ mixto, con monto, explicación en el detalle, acumulado si la carga anterior era de días atrás, y línea en el reporte al gerente. Datos v6.
- **1.11.0** — "✓ Pagó y cerrar" (registra pago, cumple compromisos pendientes y archiva como Se regularizó); 📤 Reporte al gerente por oficina con lo trabajado en el día (última gestión o todas, compromisos/plan pendientes, cuentas cerradas y sin contacto), teléfono del gerente guardado por oficina.
- **1.10.0** — Cintilla muestra la última gestión (hora, tipo, resultado y comentario); botón "▲ Cerrar" al final del detalle; rondas: la cuenta gestionada en las últimas 3 horas se atenúa con ✓ y baja al final, contador de atendidas en el encabezado.
- **1.9.0** — Días de atraso estimados: las cuentas que siguen en seguimiento suman un día por cada día desde su última carga (del día con fecha: después del vencimiento); se detiene si se registra pago; marca "est."; al recargar se usan los días reales. Datos v5.
- **1.8.0** — Plan de pago: varios pagos con fecha y monto, botón Resto, condonación de multa condicionada (8+ días: total = saldo en atraso − multa), mensaje de confirmación por WhatsApp (solo titular), aviso 📋 en la tarjeta y cierre automático: condonación procede o se cancela. Datos v4.
- **1.7.1** — Mensajes preventivos con tono de recordatorio de cortesía (sin sonar a cobranza).
- **1.7.0** — Columna opcional "Fecha de vencimiento": mensajes preventivos con {cuando} (hoy / mañana / este jueves 17), aviso 📅 en la tarjeta, filtro "Paga pronto" (0-3 días) y orden por fecha en cuentas al corriente. Datos v3.
- **1.6.1** — Ícono nuevo: flecha de recuperación naranja con $ sobre fondo negro.
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
