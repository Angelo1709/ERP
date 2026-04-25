# Project Memory - ERP LDS Agro

Last update: 2026-04-24 (iteracion funcional UX + reglas comerciales)

## Context from user
- Goal: build an ERP for company operations, as automated as possible.
- Priority: simple and interactive UX for daily data entry and control.
- Expected scope includes OCR-assisted ingestion of documents:
  - invoices (`facturas`)
  - delivery notes (`remitos`)
  - receipts (`recibos`)
- Current reference process lives in an Excel workbook used in production.

## Main business pain point to solve
- A single operation may have partial logistics and billing (example: 10 units delivered, only 8 invoiced now).
- Need a practical control model to track each operation across independent stages without losing traceability:
  - committed/sold
  - delivered (`remitado`)
  - invoiced (`facturado`)
  - collected (`cobrado`)

## Existing app artifact
- The previous assistant produced `src/erp-lds-agro.jsx`.
- This component should be the main app rendered by `src/App.jsx`.

## Decisions already applied in this repo
- `src/App.jsx` now renders `src/erp-lds-agro.jsx`.
- Visual fix: UI now relies on Tailwind CDN in `index.html`; legacy Vite starter CSS was removed from `src/index.css`.
- Persistence: `server/index.js` provides SQLite-backed state storage (`data/erp.sqlite`) and CSV live feeds in `data/live/*.csv`.
- Persistence (updated):
  - `server/index.js` now supports storage mode `mysql` / `sqlite` / `json`.
  - Selection via env `ERP_STORAGE` (`auto` by default).
  - If MySQL is configured (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_DATABASE`), API can persist in MySQL table `app_state`.
  - Existing Excel/Power BI endpoints remain unchanged (`/live/*.csv`, `/api/excel/tables`, `/api/powerbi/tables`).
  - Added migration script `npm run migrate:mysql` to copy current local state to MySQL.
- Current business/UX additions in this iteration:
  - Facturacion:
    - filtro por `Vendedor -> Cliente -> Operacion` para acelerar carga.
    - soporte de IVA por factura (`10.5%` / `21%`) segun producto y editable al facturar.
    - facturas multiproducto agrupadas en una sola fila con boton `Detalle`.
  - Operaciones:
    - boton `Cobrar` activo tambien en operaciones agrupadas (sin obligar abrir detalle primero).
    - factura en lote genera mismo `facBaseId` para permitir agrupacion visual.
  - Recibos:
    - ahora permite guardar recibo sin cliente y sin factura (anticipos / cobros no vinculados).
  - Maestros:
    - `Clientes` ahora puede vincularse a `Vendedor`.
    - `Productos` incorpora selector desplegable de IVA por producto (`10.5%` / `21%`).
  - Compatibilidad de datos:
    - se agrego normalizacion al cargar/guardar estado para mantener compatibilidad con datos previos y completar nuevos campos (`iva`, `ivaPct`, `facBaseId`, `facLine`, etc.).
- Frontend persistence flow:
  - tries API (`/api/state`) first
  - falls back to bridge storage/localStorage if API is unavailable.
- Dev scripts:
  - `npm run dev:api` starts local API on port `4000`
  - `npm run api` same as above
  - `npm run dev:web` starts Vite
  - `npm run dev` runs both.
- Power BI / Excel feed endpoints:
  - `/live/<tabla>.csv` for near-real-time refresh
  - `/api/export/<tabla>.csv` on-demand CSV
  - `/api/powerbi/tables` feed catalog.
- UX ventas:
  - Alta de operaciones ahora permite varios productos en una sola carga.
  - Internamente se crean lineas por producto (`OP_xxxx-1`, `OP_xxxx-2`, etc.) para mantener trazabilidad de remitos/facturas/cobros por item.
  - Vista Operaciones agrupada por operacion base (`OP_xxxx`) para evitar filas duplicadas.
  - Si una operacion tiene mas de un producto, en columna Producto se muestra `N productos`.
  - Boton `Detalle` para desagregar y operar por cada linea/producto.
  - Acciones rapidas ahora se muestran en columna vertical (una debajo de la otra) y no en secuencia oculta.
  - Si una accion aun no es ejecutable (por ejemplo facturar sin remito), se muestra igual como pendiente con estado bloqueado.
  - En operaciones multiproducto, acciones de grupo sin abrir detalle:
    - `Remitir todo` con checklist por producto.
    - `Facturar todo` con checklist por producto y posibilidad de desmarcar items.
  - Facturacion habilitada aun sin remito:
    - Se valida contra cantidad comprometida de la operacion (no contra remitado).
    - Accion rapida y facturacion en lote permiten facturar previo a remitar.
  - Filtros de Operaciones:
    - `Todas`
    - `Pend. Facturar`
    - `Pend. Remitir`
    - `Pend. Cobrar`
  - Alta de Operacion con OCR:
    - Boton `OCR` dentro del modal de `Nueva Operacion`.
    - Selector de tipo (`Factura`, `Remito`, `Recibo`).
    - Carga de archivo `imagen` o `PDF`.
    - OCR completa campos de la operacion (fecha/cliente/item) para iniciar gestion.

## Next iteration focus
- Validate current data model and UX around partial flows:
  - one operation -> multiple remitos
  - one operation -> multiple facturas
  - one/many receipts linked to invoices
- Design guided workflow to reduce manual errors and make pending amounts explicit.
- Then implement OCR ingestion pipeline incrementally (upload -> parse -> review -> confirm).
