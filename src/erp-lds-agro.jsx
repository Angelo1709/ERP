import { Fragment, useState, useEffect, useRef } from "react";

// â”€â”€â”€ SEED DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SEED = {
  vendedores: [
    { id: 1, nombre: "Ariel Galindo" },
    { id: 2, nombre: "Lucas Dalzotto" },
    { id: 3, nombre: "Matias" },
    { id: 4, nombre: "Guille DelPupo" },
  ],
  productos: [
    { id: 1, nombre: "Glifosato liquido", tipo: "Herbicida", costo: 3.65, precio: 4.2, iva: 10.5 },
    { id: 2, nombre: "Imazetapyr", tipo: "Herbicida", costo: 4.35, precio: 5, iva: 21 },
    { id: 3, nombre: "Metribuzin", tipo: "Herbicida", costo: 13.91, precio: 16, iva: 21 },
    { id: 4, nombre: "Diflufenicam", tipo: "Herbicida", costo: 20.87, precio: 24, iva: 21 },
    { id: 5, nombre: "2-4D", tipo: "Herbicida", costo: 3.0, precio: 5, iva: 10.5 },
  ],
  clientes: [
    { id: 1, nombre: "CLIENTE 1", cuit: "20440629327", vendedorId: 2 },
    { id: 2, nombre: "CLIENTE 2", cuit: "20462209208", vendedorId: 2 },
  ],
  proveedores: [
    { id: 1, nombre: "Proveedor 1", cuit: "20440629327" },
    { id: 2, nombre: "Proveedor 2", cuit: "20462209208" },
  ],
  operaciones: [
    { id: "OP_0001", fecha: "2026-04-19", vendedorId: 2, clienteId: 1, productoId: 5, precio: 5, cantidad: 150, obs: "" },
    { id: "OP_0002", fecha: "2026-04-20", vendedorId: 2, clienteId: 2, productoId: 5, precio: 5, cantidad: 100, obs: "" },
  ],
  facturas: [
    { id: "F_0001", fecha: "2026-04-21", opId: "OP_0001", productoId: 5, cantidad: 150, precioUnit: 5, ivaPct: 10.5, fechaCobro: "2026-08-29", cobrado: 0, clienteId: 1, vendedorId: 2 },
    { id: "F_0002", fecha: "2026-04-21", opId: "OP_0002", productoId: 5, cantidad: 100, precioUnit: 5, ivaPct: 10.5, fechaCobro: "", cobrado: 0, clienteId: 2, vendedorId: 2 },
  ],
  remitos: [
    { id: "R-0001", opId: "OP_0001", fecha: "2026-04-21", productoId: 5, cantidad: 150, obs: "", lote: "" },
    { id: "R-0002", opId: "OP_0002", fecha: "2026-04-21", productoId: 5, cantidad: 100, obs: "", lote: "" },
  ],
  recibos: [
    { id: "RC_0001", fecha: "2026-04-21", clienteId: 1, facturaId: "F_0001", concepto: "pago factura", monto: 1270500, moneda: "PESOS", tc: 1400, medioPago: "EFECTIVO" },
    { id: "RC_0002", fecha: "2026-04-21", clienteId: 2, facturaId: "F_0002", concepto: "", monto: 300, moneda: "DOLAR", tc: 1400, medioPago: "EFECTIVO" },
  ],
  compras: [
    { id: "OC_0001", fecha: "2026-04-01", proveedorId: 1, productoId: 5, cantidad: 100, precio: 4.3, moneda: "USD", entregaEst: "2026-05-10", recepcion: "2026-05-10", cantRecibida: 100, pagado: 520.3, medioPago: "TRANSFERENCIA" },
    { id: "OC_0002", fecha: "2026-04-10", proveedorId: 2, productoId: 5, cantidad: 100, precio: 4.4, moneda: "USD", entregaEst: "2026-04-15", recepcion: "2026-05-16", cantRecibida: 100, pagado: 0, medioPago: "" },
  ],
  costos: [],
  cnt: { op: 2, fac: 2, rem: 2, rec: 2, oc: 2, cos: 0, cli: 2, prov: 2, prod: 5, vend: 4 },
};

// â”€â”€â”€ UTILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmt = (n, d = 2) => n == null ? "-" : Number(n).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtD = (d) => d ? d.split("-").reverse().join("/") : "-";
const today = () => new Date().toISOString().split("T")[0];
const pad4 = (n) => String(n).padStart(4, "0");
const num = (v) => isNaN(+v) ? 0 : +v;
const lookupNombre = (arr, id) => arr?.find(x => x.id === +id)?.nombre || "-";
const hasValue = (v) => v !== undefined && v !== null && String(v) !== "";
const ivaPct = (v) => {
  const n = num(v);
  return n > 0 ? n : 21;
};
const productoById = (productos, id) => productos?.find((p) => +p.id === +id);
const productoIvaPct = (productos, productoId) => ivaPct(productoById(productos, productoId)?.iva);
const opIvaPct = (op, productos) => productoIvaPct(productos, op?.productoId);
const ivaAmount = (base, pctIva) => num(base) * (ivaPct(pctIva) / 100);
const totalWithIva = (base, pctIva) => num(base) + ivaAmount(base, pctIva);
const opBaseId = (id = "") => String(id).split("-")[0];
const parseLineNo = (id = "") => {
  const parts = String(id).split("-");
  if (parts.length < 2) return 1;
  const last = Number(parts[parts.length - 1]);
  return Number.isFinite(last) && last > 0 ? last : 1;
};
const facturaBaseId = (f) => f?.facBaseId || opBaseId(f?.id || "");
const facturaLineNo = (f) => num(f?.facLine) > 0 ? num(f.facLine) : parseLineNo(f?.id || "");
const facturaIvaPct = (f, productos = []) => hasValue(f?.ivaPct) ? ivaPct(f.ivaPct) : productoIvaPct(productos, f?.productoId);
const facSubtotal = (f) => num(f?.cantidad) * num(f?.precioUnit);
const facTotal = (f, productos = []) => totalWithIva(facSubtotal(f), facturaIvaPct(f, productos));
const opTotalUSD = (op, productos = []) => totalWithIva(num(op?.cantidad) * num(op?.precio), opIvaPct(op, productos));

const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const pct = (a, b) => b > 0 ? clamp(Math.round((a / b) * 100), 0, 100) : 0;
const moneyToUSD = (monto, moneda, tc) => moneda === "DOLAR" ? num(monto) : num(monto) / (num(tc) || 1);
const reciboUSD = (r) => moneyToUSD(r?.monto, r?.moneda, r?.tc);
const inDateRange = (dateStr, range) => {
  const value = String(dateStr || "").slice(0, 10);
  const from = String(range?.from || "");
  const to = String(range?.to || "");
  if (!value) return !from && !to;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
};
const monthKeyFromDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabelEs = (key) => {
  const [yy, mm] = String(key || "").split("-");
  const y = Number(yy);
  const m = Number(mm);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return key || "-";
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "numeric" });
};
const lastMonthKeys = (count = 6) => {
  const out = [];
  const base = new Date();
  base.setDate(1);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
};
const facturaCobradaUSD = (factura, recibos) => {
  const cobradoRecibos = recibos.filter(r => r.facturaId === factura.id).reduce((s, r) => s + reciboUSD(r), 0);
  return Math.max(num(factura.cobrado), cobradoRecibos);
};

// â”€â”€â”€ 3-TRACK BUSINESS LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function opTracks(op, facturas, remitos, recibos, productos = []) {
  const comprometido = num(op.cantidad);
  const facturasOp = facturas.filter(f => f.opId === op.id);
  const remitado = remitos.filter(r => r.opId === op.id).reduce((s, r) => s + num(r.cantidad), 0);
  const facturado = facturasOp.reduce((s, f) => s + num(f.cantidad), 0);
  const totalFacturadoUSD = facturasOp.reduce((s, f) => s + facTotal(f, productos), 0);
  const cobradoUSD = facturasOp.reduce((s, f) => s + facturaCobradaUSD(f, recibos), 0);
  const pendEntrega = Math.max(0, comprometido - remitado);
  const pendFacturar = Math.max(0, comprometido - facturado);
  const pendCobrar = Math.max(0, totalFacturadoUSD - cobradoUSD);
  return {
    comprometido, remitado, facturado, cobradoUSD, totalFacturadoUSD,
    pendEntrega, pendFacturar, pendCobrar,
    pctEntrega: pct(remitado, comprometido),
    pctFactura: pct(facturado, Math.max(comprometido, 1)),
    pctCobro: pct(cobradoUSD, Math.max(totalFacturadoUSD, 0.01)),
    done: remitado >= comprometido && facturado >= comprometido && pendCobrar < 0.01,
  };
}

const facSaldo = (f, recibos, productos = []) => Math.max(0, facTotal(f, productos) - facturaCobradaUSD(f, recibos));

function facStatus(f, recibos, productos = []) {
  const t = facTotal(f, productos), c = facturaCobradaUSD(f, recibos), s = t - c;
  if (s <= 0.01) return "Pagado";
  if (c > 0) return "Parcial";
  if (f.fechaCobro && new Date(f.fechaCobro) < new Date()) return "Vencido";
  return "Pendiente";
}

function compraStatus(c) {
  if (num(c.cantRecibida) >= num(c.cantidad)) {
    return num(c.pagado) >= num(c.cantidad) * num(c.precio) ? "Completa" : "Pend. Pago";
  }
  return num(c.cantRecibida) > 0 ? "Parcial" : "Pendiente";
}

function stockProd(id, compras, remitos) {
  const ent = compras.filter(c => +c.productoId === +id).reduce((s, c) => s + num(c.cantRecibida), 0);
  const sal = remitos.filter(r => +r.productoId === +id).reduce((s, r) => s + num(r.cantidad), 0);
  return ent - sal;
}

const stockStatus = (s) => s < 0 ? "NEGATIVO" : s === 0 ? "SIN STOCK" : s <= 20 ? "BAJO" : "OK";
const opSelectLabel = (op, clientes, productos) =>
  `${op.id} - ${lookupNombre(clientes, op.clienteId)} - ${lookupNombre(productos, op.productoId)} (${num(op.cantidad)} u.)`;
async function callOcrApi({ prompt, mimeType, base64 }) {
  let res;
  try {
    res = await fetchApi("/api/ocr/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        mimeType: mimeType || "image/jpeg",
        base64,
      }),
    });
  } catch (err) {
    throw new Error(`No se pudo conectar con OCR. Verifica que el server API este corriendo en puerto 4000. (${err?.message || "fetch failed"})`);
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.error || (res.status === 404 ? "Endpoint OCR no encontrado en el servidor." : text || `Error HTTP ${res.status}`);
    throw new Error(msg);
  }
  return json?.data || {};
}

// â”€â”€â”€ ATOM COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_CLS = {
  "OK": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Pagado": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Completa": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Vencido": "bg-red-100 text-red-700 border-red-200",
  "NEGATIVO": "bg-red-100 text-red-700 border-red-200",
  "SIN STOCK": "bg-red-100 text-red-700 border-red-200",
  "Pend. Pago": "bg-violet-100 text-violet-700 border-violet-200",
  "Parcial": "bg-amber-100 text-amber-700 border-amber-200",
  "Pendiente": "bg-blue-100 text-blue-700 border-blue-200",
  "BAJO": "bg-amber-100 text-amber-700 border-amber-200",
};

function Bdg({ s }) {
  const cls = STATUS_CLS[s] || "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{s}</span>;
}

const IC = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";
const IC_COMPACT = "w-full min-w-[88px] h-11 border border-gray-200 rounded-xl px-2.5 py-2 text-sm font-semibold text-gray-800 bg-white text-center leading-5 focus:outline-none focus:ring-2 focus:ring-emerald-400";

function Fl({ label, children, span2 }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, wide, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">x</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FBtns({ onSave, onCancel, saveLabel = "Guardar" }) {
  return (
    <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
      <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-700">Cancelar</button>
      <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm">{saveLabel}</button>
    </div>
  );
}

function PageHdr({ title, sub, onNew, btn = "+ Nuevo" }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {onNew && <button onClick={onNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0">{btn}</button>}
    </div>
  );
}

function DateRangeFilter({ range, onChange, count, total }) {
  const hasFilter = Boolean(range?.from || range?.to);
  return (
    <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Rango de fechas</span>
      <input
        type="date"
        className="border border-emerald-200 rounded-lg px-2 py-1 text-xs bg-white"
        value={range?.from || ""}
        onChange={(e) => onChange((r) => ({ ...r, from: e.target.value }))}
      />
      <span className="text-xs text-emerald-600">a</span>
      <input
        type="date"
        className="border border-emerald-200 rounded-lg px-2 py-1 text-xs bg-white"
        value={range?.to || ""}
        onChange={(e) => onChange((r) => ({ ...r, to: e.target.value }))}
      />
      <button
        type="button"
        onClick={() => onChange({ from: "", to: "" })}
        disabled={!hasFilter}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-100 disabled:opacity-40"
      >
        Limpiar
      </button>
      {typeof count === "number" && typeof total === "number" && (
        <span className="text-xs text-emerald-700 ml-auto">{count} de {total} registros</span>
      )}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto ${className}`}>{children}</div>;
}

function THead({ cols, compact = false, sticky = false, center = true, green = true }) {
  const alignCls = center ? "text-center" : "text-left";
  const thColorCls = green ? "text-emerald-700" : "text-gray-400";
  const thCls = compact
    ? `${alignCls} px-2 py-2 text-[10px] ${thColorCls} font-semibold uppercase tracking-wide whitespace-nowrap`
    : `${alignCls} px-4 py-3 ${thColorCls} font-semibold text-xs uppercase tracking-wider whitespace-nowrap`;
  const theadBase = green ? "bg-emerald-50 border-b border-emerald-100" : "bg-gray-50 border-b border-gray-100";
  const theadCls = sticky
    ? `${theadBase} sticky top-0 z-20`
    : theadBase;
  return (
    <thead className={theadCls}>
      <tr>{cols.map((c, i) => <th key={i} className={thCls}>{c}</th>)}</tr>
    </thead>
  );
}

function TR({ children, highlight, rowRef }) {
  return <tr ref={rowRef} className={`border-b border-gray-50 transition-colors text-center ${highlight ? "bg-amber-50/40" : "hover:bg-gray-50/70"}`}>{children}</tr>;
}

function TD({ children, right, center = true, mono, bold, gray, green, red, compact = false, nowrap = true }) {
  const sizeCls = compact ? "px-2 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const wrapCls = nowrap ? "whitespace-nowrap" : "whitespace-normal break-words";
  const alignCls = center ? "text-center" : (right ? "text-right" : "");
  return (
    <td className={`${sizeCls} ${wrapCls} ${alignCls} ${mono ? "font-mono text-xs" : ""} ${bold ? "font-semibold" : ""} ${gray ? "text-gray-400" : red ? "text-red-500" : green ? "text-emerald-600" : "text-gray-700"}`}>
      {children}
    </td>
  );
}

function IconPencil({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 113 3L8 18l-4 1 1-4z" />
    </svg>
  );
}

function IconTrash({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function Btns({ onEdit, onDel, compact = false }) {
  const tdCls = compact ? "px-1.5 py-1.5 text-center" : "px-3 py-2.5";
  const btnCls = compact ? "p-1 text-gray-700 hover:text-gray-900 hover:bg-slate-100 rounded-lg" : "p-1.5 text-gray-700 hover:text-gray-900 hover:bg-slate-100 rounded-lg";
  const delBtnCls = compact ? "p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" : "p-1.5 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg";
  return (
    <td className={tdCls}>
      <div className={compact ? "flex justify-center gap-0.5" : "flex gap-1"}>
        <button onClick={onEdit} className={btnCls} title="Editar" aria-label="Editar">
          <IconPencil className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
        <button onClick={onDel} className={delBtnCls} title="Eliminar" aria-label="Eliminar">
          <IconTrash className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
      </div>
    </td>
  );
}

function EmptyRow({ cols }) {
  return <tr><td colSpan={cols} className="text-center py-14 text-gray-300 text-sm">Sin registros</td></tr>;
}

function KPIIcon({ name, className = "w-6 h-6" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "doc":
      return <svg {...props}><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4M10 12h6M10 16h6" /></svg>;
    case "pay":
      return <svg {...props}><rect x="3" y="6.5" width="18" height="11" rx="2" /><path d="M3 10h18M7 14h4" /></svg>;
    case "chart":
      return <svg {...props}><path d="M4 19V5M10 19v-7M16 19v-4M22 19v-9" /></svg>;
    case "ops":
      return <svg {...props}><path d="M13 2L4 14h7l-1 8 10-12h-7z" /></svg>;
    case "cart":
      return <svg {...props}><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /><path d="M3 5h2l2.2 10h10.3l2-7H7.5" /></svg>;
    case "box":
      return <svg {...props}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" /></svg>;
    case "costs":
      return <svg {...props}><path d="M4 7h16M6 11h12M8 15h8M10 19h4" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

function KPI({ label, value, sub, color = "emerald", icon }) {
  const c = { emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", blue: "bg-blue-50 text-blue-600 border-blue-100", amber: "bg-amber-50 text-amber-600 border-amber-100", red: "bg-red-50 text-red-600 border-red-100", violet: "bg-violet-50 text-violet-600 border-violet-100" };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${c[color]}`}>
        <KPIIcon name={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-800 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// â”€â”€â”€ 3-TRACK BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TrackBar({ label, value, max, color, isUSD, compact = false }) {
  const p = pct(value, max);
  const colors = {
    blue: { bar: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700" },
    violet: { bar: "bg-violet-500", bg: "bg-violet-100", text: "text-violet-700" },
    green: { bar: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700" },
  };
  const cl = colors[color];
  return (
    <div className={`flex items-center gap-2 ${compact ? "text-[10px]" : "text-xs"}`}>
      <span className={`${compact ? "w-14" : "w-14"} text-gray-400 font-medium flex-shrink-0 text-right whitespace-nowrap`}>{label}</span>
      <div className={`flex-1 min-w-0 ${compact ? "h-1.5" : "h-2"} rounded-full ${cl.bg} overflow-hidden`} style={{ minWidth: compact ? 20 : 40 }}>
        <div className={`h-full rounded-full ${cl.bar}`} style={{ width: `${p}%` }} />
      </div>
      <span className={`${compact ? "w-14" : "w-24"} text-right font-semibold ${cl.text} tabular-nums`}>
        {isUSD ? `$${fmt(value, 0)}/$${fmt(max, 0)}` : `${value}/${max}`}
      </span>
    </div>
  );
}

function TrackPanel({ tracks, compact = false }) {
  return (
    <div className={`${compact ? "space-y-1 py-0 w-full min-w-0" : "space-y-1.5 py-0.5 min-w-52"}`}>
      <TrackBar label={compact ? "Ent." : "Entrega"} value={tracks.remitado} max={tracks.comprometido} color="blue" compact={compact} />
      <TrackBar label={compact ? "Fac." : "Factura"} value={tracks.facturado} max={Math.max(tracks.comprometido, 1)} color="violet" compact={compact} />
      <TrackBar label={compact ? "Cobrado" : "Cobrado"} value={tracks.cobradoUSD} max={Math.max(tracks.totalFacturadoUSD, 0.01)} color="green" isUSD compact={compact} />
    </div>
  );
}

// â”€â”€â”€ QUICK ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function QuickActions({ op, tracks, onQR, onQF, onQC, compact = false }) {
  const pendFacturaGlobal = Math.max(0, tracks.comprometido - tracks.facturado);
  const showRemito = tracks.pendEntrega > 0;
  const showFactura = pendFacturaGlobal > 0;
  const showCobro = tracks.pendCobrar > 0.01 && tracks.totalFacturadoUSD > 0;

  if (!showRemito && !showFactura && !showCobro) {
    return <span className="text-xs text-gray-300">Sin pendientes</span>;
  }

  return (
    <div className={`flex flex-col gap-1 ${compact ? "w-full min-w-0" : "min-w-[170px]"}`}>
      {showRemito && (
        <button onClick={() => onQR(op, tracks)} className={`w-full px-2 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold border border-blue-100 whitespace-nowrap`}>
          Remito ({tracks.pendEntrega})
        </button>
      )}
      {showFactura && (
        <button onClick={() => onQF(op, tracks)} className={`w-full px-2 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg font-semibold border border-violet-100 whitespace-nowrap`}>
          Facturar ({pendFacturaGlobal})
        </button>
      )}
      {showCobro && (
        <button onClick={() => onQC(op, tracks)} className={`w-full px-2 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-semibold border border-emerald-100 whitespace-nowrap`}>
          Cobrar
        </button>
      )}
    </div>
  );
}

const SelCliente = ({ val, onChange, clientes }) => (
  <select className={IC} value={val || ""} onChange={onChange}>
    <option value="">Seleccionar cliente...</option>
    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
  </select>
);

const SelProd = ({ val, onChange, productos }) => (
  <select className={IC} value={val || ""} onChange={onChange}>
    <option value="">Seleccionar producto...</option>
    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
  </select>
);

// â”€â”€â”€ OPERACIONES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Operaciones({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [opItems, setOpItems] = useState([{ productoId: "", precio: "", cantidad: "" }]);
  const [expandId, setExpandId] = useState(null);
  const [qRem, setQRem] = useState(null);
  const [qFac, setQFac] = useState(null);
  const [qRemGroup, setQRemGroup] = useState(null);
  const [qFacGroup, setQFacGroup] = useState(null);
  const [qRec, setQRec] = useState(null);
  const [opFilter, setOpFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [opOcrModal, setOpOcrModal] = useState(false);
  const [opOcrDocType, setOpOcrDocType] = useState("factura");
  const [opOcrPreview, setOpOcrPreview] = useState(null);
  const [opOcrB64, setOpOcrB64] = useState(null);
  const [opOcrMime, setOpOcrMime] = useState("");
  const [opOcrFileName, setOpOcrFileName] = useState("");
  const [opOcrLoading, setOpOcrLoading] = useState(false);
  const [opOcrExtracted, setOpOcrExtracted] = useState(null);
  const opOcrFileRef = useRef(null);
  const { operaciones, facturas, remitos, recibos, clientes, productos, vendedores } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setOpItem = (idx, key, value) => setOpItems(items => items.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  const addOpItem = () => setOpItems(items => [...items, { productoId: "", precio: "", cantidad: "" }]);
  const delOpItem = (idx) => setOpItems(items => items.length <= 1 ? items : items.filter((_, i) => i !== idx));
  const clientesPorVendedor = form.vendedorId
    ? clientes.filter((c) => !hasValue(c.vendedorId) || +c.vendedorId === +form.vendedorId)
    : clientes;
  const opOcrPrompts = {
    factura: `Analiza esta factura de venta y devuelve SOLO JSON:\n{"fecha":"YYYY-MM-DD","cliente":"nombre","producto":"descripcion","cantidad":0,"precioUnitario":0,"observaciones":""}`,
    remito: `Analiza este remito y devuelve SOLO JSON:\n{"fecha":"YYYY-MM-DD","cliente":"nombre","producto":"descripcion","cantidad":0,"lote":"","observaciones":""}`,
    recibo: `Analiza este recibo y devuelve SOLO JSON:\n{"fecha":"YYYY-MM-DD","cliente":"nombre","concepto":"","monto":0,"moneda":"PESOS o DOLAR","observaciones":""}`,
  };
  const opOcrLabels = { factura: "Factura", remito: "Remito", recibo: "Recibo" };
  const matchByName = (arr, val) => arr.find(x => val && x.nombre.toLowerCase().includes(String(val).toLowerCase()));

  const onOpOcrFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl !== "string") return;
      setOpOcrB64(dataUrl.split(",")[1] || null);
      setOpOcrMime(file.type || "image/jpeg");
      setOpOcrFileName(file.name || "");
      setOpOcrExtracted(null);
      if ((file.type || "").startsWith("image/")) setOpOcrPreview(dataUrl);
      else setOpOcrPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeOpOcr = async () => {
    if (!opOcrB64) return;
    setOpOcrLoading(true);
    setOpOcrExtracted(null);
    try {
      const parsed = await callOcrApi({
        prompt: opOcrPrompts[opOcrDocType],
        mimeType: opOcrMime || "image/jpeg",
        base64: opOcrB64,
      });
      setOpOcrExtracted(parsed);
    } catch (err) {
      alert(`Error OCR: ${err?.message || "verifica archivo o configuracion OCR del servidor."}`);
    }
    setOpOcrLoading(false);
  };

  const applyOpOcr = () => {
    if (!opOcrExtracted) return;
    const cli = matchByName(clientes, opOcrExtracted.cliente);
    const prod = matchByName(productos, opOcrExtracted.producto);
    const nextObs = [form.obs || "", opOcrExtracted.observaciones || opOcrExtracted.concepto || ""].filter(Boolean).join(" | ");

    setForm(f => ({
      ...f,
      fecha: opOcrExtracted.fecha || f.fecha || today(),
      clienteId: cli?.id || f.clienteId || "",
      obs: nextObs,
    }));

    if (opOcrExtracted.producto || opOcrDocType !== "recibo") {
      setOpItems([{
        productoId: prod?.id || "",
        precio: +opOcrExtracted.precioUnitario || +opOcrExtracted.precio || "",
        cantidad: +opOcrExtracted.cantidad || "",
      }]);
    }
    setOpOcrModal(false);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ fecha: today(), vendedorId: "", clienteId: "", obs: "" });
    setOpItems([{ productoId: "", precio: "", cantidad: "" }]);
    setModal(true);
  };
  const openEdit = (op) => {
    setEditId(op.id);
    setForm({ ...op });
    setOpItems([{ productoId: op.productoId, precio: op.precio, cantidad: op.cantidad }]);
    setModal(true);
  };
  const del = (id) => { if (confirm("Eliminar operacion?")) onUpdate("operaciones", operaciones.filter(o => o.id !== id)); };

  const save = () => {
    if (!form.fecha || !form.clienteId) return alert("Completa fecha y cliente.");
    if (form.vendedorId) {
      const cli = clientes.find((c) => +c.id === +form.clienteId);
      if (cli && hasValue(cli.vendedorId) && +cli.vendedorId !== +form.vendedorId) {
        return alert("Ese cliente no pertenece al vendedor seleccionado.");
      }
    }
    const parsedItems = opItems.map(it => ({
      productoId: +it.productoId,
      precio: +it.precio,
      cantidad: +it.cantidad,
    }));
    const invalid = parsedItems.some(it => !it.productoId || it.cantidad <= 0);
    if (invalid) return alert("Completa producto y cantidad en todos los renglones.");

    const head = {
      fecha: form.fecha,
      vendedorId: form.vendedorId ? +form.vendedorId : "",
      clienteId: +form.clienteId,
      obs: form.obs || "",
    };

    if (editId) {
      const it = parsedItems[0];
      const rec = { ...form, ...head, productoId: it.productoId, precio: it.precio, cantidad: it.cantidad, id: editId };
      onUpdate("operaciones", operaciones.map(o => o.id === editId ? rec : o));
    } else {
      const n = data.cnt.op + 1;
      const baseId = `OP_${pad4(n)}`;
      const ops = parsedItems.map((it, idx) => ({
        ...head,
        id: parsedItems.length === 1 ? baseId : `${baseId}-${idx + 1}`,
        opBaseId: baseId,
        opLine: idx + 1,
        opLines: parsedItems.length,
        productoId: it.productoId,
        precio: it.precio,
        cantidad: it.cantidad,
      }));
      onUpdate("operaciones", [...operaciones, ...ops]);
      onUpdate("cnt", { ...data.cnt, op: n });
    }
    setModal(false);
  };

  const saveQRem = () => {
    const qty = num(qRem.cantidad);
    if (qty <= 0) return alert("Ingresa una cantidad mayor a 0.");
    const op = operaciones.find(o => o.id === qRem.opId);
    if (!op) return alert("No se encontro la operacion.");
    const tracks = opTracks(op, facturas, remitos, recibos, productos);
    if (qty > tracks.pendEntrega) return alert(`No podes remitar mas de lo pendiente (${tracks.pendEntrega} u.).`);
    const n = data.cnt.rem + 1;
    onUpdate("remitos", [...remitos, { id: `R-${pad4(n)}`, opId: qRem.opId, fecha: qRem.fecha, productoId: +qRem.productoId, cantidad: qty, obs: qRem.obs || "", lote: qRem.lote || "" }]);
    onUpdate("cnt", { ...data.cnt, rem: n });
    setQRem(null);
  };

  const saveQFac = () => {
    const qty = num(qFac.cantidad);
    if (qty <= 0) return alert("Ingresa una cantidad mayor a 0.");
    const op = operaciones.find(o => o.id === qFac.opId);
    if (!op) return alert("No se encontro la operacion.");
    const tracks = opTracks(op, facturas, remitos, recibos, productos);
    const pendGlobal = Math.max(0, num(op.cantidad) - tracks.facturado);
    if (qty > pendGlobal) return alert(`No podes facturar mas de lo pendiente (${pendGlobal} u.).`);
    const iva = productoIvaPct(productos, qFac.productoId);
    const n = data.cnt.fac + 1;
    const facId = `F_${pad4(n)}`;
    onUpdate("facturas", [...facturas, {
      id: facId,
      facBaseId: facId,
      facLine: 1,
      fecha: qFac.fecha,
      opId: qFac.opId,
      productoId: +qFac.productoId,
      cantidad: qty,
      precioUnit: +qFac.precioUnit,
      ivaPct: iva,
      fechaCobro: qFac.fechaCobro || "",
      cobrado: 0,
      clienteId: op.clienteId || null,
      vendedorId: op.vendedorId || null,
    }]);
    onUpdate("cnt", { ...data.cnt, fac: n });
    setQFac(null);
  };

  const openQRemGroup = (group) => {
    const items = group.lines.map((op) => {
      const t = opTracks(op, facturas, remitos, recibos, productos);
      return {
        opId: op.id,
        productoId: op.productoId,
        producto: lookupNombre(productos, op.productoId),
        max: t.pendEntrega,
        cantidad: t.pendEntrega,
        selected: t.pendEntrega > 0,
      };
    });
    if (!items.some(i => i.max > 0)) return alert("No hay pendientes de remito en esta operacion.");
    setQRemGroup({ key: group.key, fecha: today(), items, obs: "", lote: "" });
  };

  const saveQRemGroup = () => {
    const selected = qRemGroup.items.filter(i => i.selected && num(i.cantidad) > 0);
    if (!selected.length) return alert("Selecciona al menos un producto para remitir.");
    const invalid = selected.find(i => num(i.cantidad) > num(i.max));
    if (invalid) return alert(`La cantidad de ${invalid.producto} supera lo pendiente (${invalid.max} u.).`);

    const base = data.cnt.rem;
    const nuevos = selected.map((it, idx) => ({
      id: `R-${pad4(base + idx + 1)}`,
      opId: it.opId,
      fecha: qRemGroup.fecha,
      productoId: +it.productoId,
      cantidad: +it.cantidad,
      obs: qRemGroup.obs || "",
      lote: qRemGroup.lote || "",
    }));
    onUpdate("remitos", [...remitos, ...nuevos]);
    onUpdate("cnt", { ...data.cnt, rem: base + nuevos.length });
    setQRemGroup(null);
  };

  const openQFacGroup = (group) => {
    const items = group.lines.map((op) => {
      const t = opTracks(op, facturas, remitos, recibos, productos);
      const pendGlobal = Math.max(0, num(op.cantidad) - t.facturado);
      return {
        opId: op.id,
        productoId: op.productoId,
        producto: lookupNombre(productos, op.productoId),
        precio: op.precio,
        ivaPct: opIvaPct(op, productos),
        max: pendGlobal,
        cantidad: pendGlobal,
        selected: pendGlobal > 0,
      };
    });
    if (!items.some(i => i.max > 0)) return alert("No hay productos pendientes de factura.");
    setQFacGroup({ key: group.key, fecha: today(), fechaCobro: "", items });
  };

  const saveQFacGroup = () => {
    const selected = qFacGroup.items.filter(i => i.selected && num(i.cantidad) > 0);
    if (!selected.length) return alert("Selecciona al menos un producto para facturar.");
    const invalid = selected.find(i => num(i.cantidad) > num(i.max));
    if (invalid) return alert(`La cantidad de ${invalid.producto} supera lo pendiente de factura (${invalid.max} u.).`);

    const next = data.cnt.fac + 1;
    const facBase = `F_${pad4(next)}`;
    const nuevos = selected.map((it, idx) => {
      const op = operaciones.find((o) => o.id === it.opId);
      return {
      id: selected.length === 1 ? facBase : `${facBase}-${idx + 1}`,
      facBaseId: facBase,
      facLine: idx + 1,
      fecha: qFacGroup.fecha,
      opId: it.opId,
      productoId: +it.productoId,
      cantidad: +it.cantidad,
      precioUnit: +it.precio,
      ivaPct: ivaPct(it.ivaPct),
      fechaCobro: qFacGroup.fechaCobro || "",
      cobrado: 0,
      clienteId: op?.clienteId || null,
      vendedorId: op?.vendedorId || null,
    };
    });
    onUpdate("facturas", [...facturas, ...nuevos]);
    onUpdate("cnt", { ...data.cnt, fac: next });
    setQFacGroup(null);
  };

  const saveQRec = () => {
    const monto = num(qRec.monto);
    if (monto <= 0) return alert("Ingresa un monto mayor a 0.");
    let clienteId = hasValue(qRec.clienteId) ? +qRec.clienteId : null;
    if (qRec.facturaId) {
      const fac = facturas.find(f => f.id === qRec.facturaId);
      if (!fac) return alert("La factura asociada no existe.");
      if (!clienteId && hasValue(fac.clienteId)) clienteId = +fac.clienteId;
      if (!clienteId) {
        const op = operaciones.find((o) => o.id === fac.opId);
        if (op?.clienteId) clienteId = +op.clienteId;
      }
      const saldo = facSaldo(fac, recibos, productos);
      const usd = moneyToUSD(monto, qRec.moneda, qRec.tc);
      if (usd > saldo + 0.01) return alert(`Ese cobro supera el saldo de la factura (USD ${fmt(saldo)}).`);
    }
    const n = data.cnt.rec + 1;
    onUpdate("recibos", [...recibos, {
      id: `RC_${pad4(n)}`,
      fecha: qRec.fecha,
      clienteId,
      facturaId: qRec.facturaId || "",
      concepto: qRec.concepto || "",
      monto,
      moneda: qRec.moneda,
      tc: +qRec.tc,
      medioPago: qRec.medioPago,
    }]);
    onUpdate("cnt", { ...data.cnt, rec: n });
    setQRec(null);
  };

  const subtotal = opItems.reduce((s, it) => s + num(it.precio) * num(it.cantidad), 0);
  const subtotalIva = opItems.reduce((s, it) => {
    const base = num(it.precio) * num(it.cantidad);
    return s + ivaAmount(base, productoIvaPct(productos, it.productoId));
  }, 0);
  const subtotalTotal = subtotal + subtotalIva;
  const delGroup = (group) => {
    const msg = group.lines.length > 1
      ? `Eliminar operacion ${group.key} completa con ${group.lines.length} productos?`
      : "Eliminar operacion?";
    if (!confirm(msg)) return;
    const ids = new Set(group.lines.map(l => l.id));
    onUpdate("operaciones", operaciones.filter(o => !ids.has(o.id)));
  };
  const calcGroupTracks = (lines) => {
    const t0 = {
      comprometido: 0, remitado: 0, facturado: 0, cobradoUSD: 0, totalFacturadoUSD: 0,
      pendEntrega: 0, pendFacturar: 0, pendCobrar: 0,
    };
    const t = lines.reduce((acc, op) => {
      const o = opTracks(op, facturas, remitos, recibos, productos);
      acc.comprometido += o.comprometido;
      acc.remitado += o.remitado;
      acc.facturado += o.facturado;
      acc.cobradoUSD += o.cobradoUSD;
      acc.totalFacturadoUSD += o.totalFacturadoUSD;
      acc.pendEntrega += o.pendEntrega;
      acc.pendFacturar += o.pendFacturar;
      acc.pendCobrar += o.pendCobrar;
      return acc;
    }, t0);
    return {
      ...t,
      pctEntrega: pct(t.remitado, Math.max(t.comprometido, 1)),
      pctFactura: pct(t.facturado, Math.max(t.comprometido, 1)),
      pctCobro: pct(t.cobradoUSD, Math.max(t.totalFacturadoUSD, 0.01)),
      done: t.pendEntrega <= 0.01 && t.pendFacturar <= 0.01 && t.pendCobrar < 0.01,
    };
  };

  const groupMap = new Map();
  const opGroups = [];
  for (const op of operaciones) {
    const key = op.opBaseId || op.id;
    if (!groupMap.has(key)) {
      const g = { key, lines: [] };
      groupMap.set(key, g);
      opGroups.push(g);
    }
    groupMap.get(key).lines.push(op);
  }
  for (const g of opGroups) {
    g.lines.sort((a, b) => num(a.opLine || 1) - num(b.opLine || 1));
    g.head = g.lines[0];
    g.multi = g.lines.length > 1;
    g.tracks = calcGroupTracks(g.lines);
    g.total = g.lines.reduce((s, o) => s + opTotalUSD(o, productos), 0);
    g.productLabel = g.multi ? `${g.lines.length} productos` : lookupNombre(productos, g.head.productoId);
    g.priceLabel = g.multi ? "-" : fmt(g.head.precio);
    g.qtyLabel = g.multi ? g.lines.reduce((s, o) => s + num(o.cantidad), 0) : g.head.cantidad;
  }
  const filterDefs = [
    { id: "all", label: "Todas", match: () => true },
    { id: "pend_facturar", label: "Pend. Facturar", match: (g) => g.tracks.pendFacturar > 0 },
    { id: "pend_remitir", label: "Pend. Remitir", match: (g) => g.tracks.pendEntrega > 0 },
    { id: "pend_cobrar", label: "Pend. Cobrar", match: (g) => g.tracks.pendCobrar > 0.01 },
  ];
  const activeFilter = filterDefs.find(f => f.id === opFilter) || filterDefs[0];
  const filteredGroups = opGroups.filter((g) => activeFilter.match(g) && inDateRange(g.head?.fecha, dateRange));

  return (
    <div>
      <PageHdr title="Operaciones Comerciales" sub="3 pistas independientes: Entrega - Facturacion - Cobro. Ahora podes cargar varios productos por operacion." onNew={openNew} btn="+ Nueva Operacion" />

      <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-xs text-blue-700 flex flex-wrap gap-4 items-center">
        <span className="font-bold text-blue-800">Como leer las barras:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Entrega: remitado vs comprometido</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-500 inline-block" /> Factura: facturado vs comprometido (puede adelantarse al remito)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Cobro: cobrado en USD vs facturado</span>
      </div>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Filtrar:</span>
        {filterDefs.map((f) => (
          <button
            key={f.id}
            onClick={() => setOpFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              opFilter === f.id
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-gray-400">{filteredGroups.length} de {opGroups.length} operaciones</span>
      </div>
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredGroups.length} total={opGroups.length} />

      <Card className="overflow-hidden">
        <div
          className="max-h-[66vh] overflow-y-auto overflow-x-scroll"
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          <table className="w-full text-xs table-fixed min-w-[1200px]">
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "3%" }} />
          </colgroup>
            <THead compact sticky center green cols={["", "ID", "Fecha", "Cliente", "Producto", "Cant.", "P.USD", "Total", "Prog.", "Acciones", ""]} />
          <tbody>
            {filteredGroups.map(group => {
              const exp = expandId === group.key;
              const head = group.head;
              const tracks = group.tracks;
              const pendFacturaGroup = Math.max(0, tracks.comprometido - tracks.facturado);
              return (
                <Fragment key={group.key}>
                  <TR key={group.key} highlight={!tracks.done && (tracks.pendFacturar > 0 || tracks.pendCobrar > 0.01)}>
                    <td className="px-1 py-1.5 align-middle text-center">
                      {group.multi ? (
                        <button
                          onClick={() => setExpandId(exp ? null : group.key)}
                          className="px-1.5 py-0.5 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          {exp ? "Ocultar" : "Detalle"}
                        </button>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <TD center mono compact>
                      <span className="text-emerald-700 font-bold text-[11px]">{group.key}</span>
                    </TD>
                    <TD center compact><span className="text-[11px]">{fmtD(head.fecha)}</span></TD>
                    <TD center compact bold nowrap={false}>{lookupNombre(clientes, head.clienteId)}</TD>
                    <TD center compact nowrap={false}>{group.productLabel}</TD>
                    <TD center compact>{group.qtyLabel}</TD>
                    <TD center compact>{group.priceLabel}</TD>
                    <TD center compact bold>USD {fmt(group.total)}</TD>
                    <td className="px-2 py-1.5 align-middle text-center"><TrackPanel tracks={tracks} compact /></td>
                    <td className="px-1.5 py-1.5 align-middle text-center">
                      {group.multi ? (
                        <div className="mx-auto flex flex-col gap-1 w-full min-w-0">
                          {tracks.pendEntrega > 0 && (
                            <button onClick={() => openQRemGroup(group)} className="w-full px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-semibold border border-blue-100 whitespace-nowrap">
                              Remitir todo ({tracks.pendEntrega})
                            </button>
                          )}
                          {pendFacturaGroup > 0 && (
                            <button onClick={() => openQFacGroup(group)} className="w-full px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg text-[10px] font-semibold border border-violet-100 whitespace-nowrap">
                              Facturar todo ({pendFacturaGroup})
                            </button>
                          )}
                          {tracks.pendCobrar > 0.01 && tracks.totalFacturadoUSD > 0 && (
                            <button
                              onClick={() => {
                                const opIds = group.lines.map((l) => l.id);
                                const facPend = facturas.find((f) => opIds.includes(f.opId) && facSaldo(f, recibos, productos) > 0.01);
                                setQRec({
                                  clienteId: head.clienteId || "",
                                  facturaId: facPend?.id || "",
                                  concepto: `Cobro ${group.key}`,
                                  monto: "",
                                  moneda: "DOLAR",
                                  tc: 1400,
                                  medioPago: "EFECTIVO",
                                  fecha: today(),
                                  _opId: group.key,
                                  _opIds: opIds,
                                });
                              }}
                              className="w-full px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-semibold border border-emerald-100 whitespace-nowrap"
                            >
                              Cobrar
                            </button>
                          )}
                        </div>
                      ) : (
                        <QuickActions op={head} tracks={tracks} compact
                          onQR={(op, t) => setQRem({ opId: op.id, productoId: op.productoId, fecha: today(), cantidad: t.pendEntrega, obs: "", lote: "" })}
                          onQF={(op, t) => setQFac({
                            opId: op.id,
                            productoId: op.productoId,
                            fecha: today(),
                            cantidad: Math.max(0, num(op.cantidad) - t.facturado),
                            precioUnit: op.precio,
                            ivaPct: opIvaPct(op, productos),
                            fechaCobro: "",
                          })}
                          onQC={(op) => {
                            const facPend = facturas.find(f => f.opId === op.id && facSaldo(f, recibos, productos) > 0.01);
                            setQRec({ clienteId: op.clienteId, facturaId: facPend?.id || "", concepto: `Cobro ${op.id}`, monto: "", moneda: "DOLAR", tc: 1400, medioPago: "EFECTIVO", fecha: today(), _opId: op.id });
                          }}
                        />
                      )}
                    </td>
                    {group.multi
                      ? (
                        <td className="px-1.5 py-1.5 align-middle text-center">
                          <button onClick={() => delGroup(group)} className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Eliminar" aria-label="Eliminar">
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )
                      : <Btns compact onEdit={() => openEdit(head)} onDel={() => del(head.id)} />}
                  </TR>
                  {exp && (
                    <tr key={`${group.key}-d`} className="bg-slate-50 border-b border-gray-100">
                      <td colSpan={11} className="px-8 py-4">
                        <table className="w-full text-[11px] table-fixed">
                          <THead compact center green cols={["ID", "Producto", "Cant.", "P.USD", "Total", "Prog.", "Acciones", ""]} />
                          <tbody>
                            {group.lines.map((op) => {
                              const tt = opTracks(op, facturas, remitos, recibos, productos);
                              return (
                                <TR key={`${group.key}-${op.id}`} highlight={!tt.done && (tt.pendFacturar > 0 || tt.pendCobrar > 0.01)}>
                                  <TD center compact mono gray>{op.id}</TD>
                                  <TD center compact nowrap={false}>{lookupNombre(productos, op.productoId)}</TD>
                                  <TD center compact>{op.cantidad}</TD>
                                  <TD center compact>{fmt(op.precio)}</TD>
                                  <TD center compact bold>USD {fmt(opTotalUSD(op, productos))}</TD>
                                  <td className="px-2 py-1.5 align-middle text-center"><TrackPanel tracks={tt} compact /></td>
                                  <td className="px-1.5 py-1.5 align-middle text-center">
                                    <QuickActions op={op} tracks={tt} compact
                                      onQR={(op, t) => setQRem({ opId: op.id, productoId: op.productoId, fecha: today(), cantidad: t.pendEntrega, obs: "", lote: "" })}
                                      onQF={(op, t) => setQFac({
                                        opId: op.id,
                                        productoId: op.productoId,
                                        fecha: today(),
                                        cantidad: Math.max(0, num(op.cantidad) - t.facturado),
                                        precioUnit: op.precio,
                                        ivaPct: opIvaPct(op, productos),
                                        fechaCobro: "",
                                      })}
                                      onQC={(op) => {
                                        const facPend = facturas.find(f => f.opId === op.id && facSaldo(f, recibos, productos) > 0.01);
                                        setQRec({ clienteId: op.clienteId, facturaId: facPend?.id || "", concepto: `Cobro ${op.id}`, monto: "", moneda: "DOLAR", tc: 1400, medioPago: "EFECTIVO", fecha: today(), _opId: op.id });
                                      }}
                                    />
                                  </td>
                                  <Btns compact onEdit={() => openEdit(op)} onDel={() => del(op.id)} />
                                </TR>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!filteredGroups.length && <EmptyRow cols={11} />}
          </tbody>
        </table>
        </div>
      </Card>

      {/* --- Modals --- */}
      {modal && (
        <Modal title={editId ? "Editar Operacion" : "Nueva Operacion"} wide onClose={() => setModal(false)}>
          {!editId && (
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setOpOcrModal(true)}
                className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold"
              >
                OCR
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Vendedor">
              <select
                className={IC}
                value={form.vendedorId || ""}
                onChange={e => setForm((prev) => {
                  const vendedorId = e.target.value;
                  const permitidos = vendedorId
                    ? clientes.filter((c) => !hasValue(c.vendedorId) || +c.vendedorId === +vendedorId)
                    : clientes;
                  const clienteVigente = permitidos.some((c) => +c.id === +prev.clienteId) ? prev.clienteId : "";
                  return { ...prev, vendedorId, clienteId: clienteVigente };
                })}
              >
                <option value="">Seleccionar...</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </Fl>
            <Fl label="Cliente *"><SelCliente val={form.clienteId} onChange={e => sf("clienteId", e.target.value)} clientes={clientesPorVendedor} /></Fl>
            <Fl label="Observaciones" span2><textarea className={IC} rows={2} value={form.obs || ""} onChange={e => sf("obs", e.target.value)} /></Fl>
            <Fl label={editId ? "Producto *" : "Productos *"} span2>
              <div className="space-y-3">
                {opItems.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="col-span-6">
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Producto</label>
                      <SelProd val={it.productoId} onChange={e => {
                        const p = productos.find(pr => pr.id === +e.target.value);
                        setOpItem(idx, "productoId", e.target.value);
                        setOpItem(idx, "precio", p?.precio || "");
                      }} productos={productos} />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Precio USD</label>
                      <input type="number" step="0.01" className={IC} value={it.precio || ""} onChange={e => setOpItem(idx, "precio", e.target.value)} />
                    </div>
                    <div className={editId ? "col-span-3" : "col-span-2"}>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cantidad</label>
                      <input type="number" className={IC} value={it.cantidad || ""} onChange={e => setOpItem(idx, "cantidad", e.target.value)} />
                    </div>
                    {!editId && (
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => delOpItem(idx)}
                          className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30"
                          disabled={opItems.length === 1}
                        >
                          x
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!editId && (
                  <button type="button" onClick={addOpItem} className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-semibold">
                    + Agregar producto
                  </button>
                )}
              </div>
            </Fl>
          </div>
          {subtotal > 0 && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Subtotal</p><p className="font-bold">USD {fmt(subtotal)}</p></div>
              <div><p className="text-xs text-gray-400">IVA total</p><p className="font-bold">USD {fmt(subtotalIva)}</p></div>
              <div><p className="text-xs text-gray-400">Total c/IVA</p><p className="font-bold text-emerald-700 text-lg">USD {fmt(subtotalTotal)}</p></div>
            </div>
          )}
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}

      {opOcrModal && (
        <Modal title="Cargar Operacion con OCR" wide onClose={() => setOpOcrModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Tipo de documento">
              <div className="flex gap-2">
                {Object.entries(opOcrLabels).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setOpOcrDocType(k); setOpOcrExtracted(null); }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border ${opOcrDocType === k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Fl>
            <Fl label="Archivo (imagen o PDF)">
              <div className="flex gap-2">
                <button type="button" onClick={() => opOcrFileRef.current?.click()} className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 text-sm">
                  Seleccionar archivo
                </button>
                <input ref={opOcrFileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onOpOcrFile} />
                <span className="text-xs text-gray-400 self-center">{opOcrFileName || "Sin archivo"}</span>
              </div>
            </Fl>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-3 min-h-40 flex items-center justify-center">
              {opOcrPreview
                ? <img src={opOcrPreview} alt="preview" className="max-h-52 object-contain rounded-lg" />
                : <p className="text-xs text-gray-400">{opOcrMime === "application/pdf" ? "PDF listo para analizar" : "Sin vista previa"}</p>}
            </div>
            <div className="border border-gray-100 rounded-xl p-3 min-h-40">
              {!opOcrExtracted
                ? <p className="text-xs text-gray-400">Analiza el archivo para autocompletar cliente, fecha y producto.</p>
                : Object.entries(opOcrExtracted).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs py-1">
                    <span className="text-gray-400 font-semibold uppercase w-24">{k}</span>
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={analyzeOpOcr}
              disabled={!opOcrB64 || opOcrLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:bg-gray-300"
            >
              {opOcrLoading ? "Analizando..." : "Analizar OCR"}
            </button>
            <button
              type="button"
              onClick={applyOpOcr}
              disabled={!opOcrExtracted}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:bg-gray-300"
            >
              Usar en Operacion
            </button>
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            El OCR usa IA externa via servidor. Si no responde, verifica `ANTHROPIC_API_KEY` en el servidor.
          </p>
        </Modal>
      )}

      {qRem && (
        <Modal title={`Nuevo Remito - ${qRem.opId}`} onClose={() => setQRem(null)}>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-sm text-blue-700">
            Producto: <strong>{lookupNombre(productos, qRem.productoId)}</strong> - Pendiente entregar: <strong>{qRem.cantidad} u.</strong>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={qRem.fecha} onChange={e => setQRem(r => ({ ...r, fecha: e.target.value }))} /></Fl>
            <Fl label="Cantidad a remitar *"><input type="number" className={IC} value={qRem.cantidad} onChange={e => setQRem(r => ({ ...r, cantidad: e.target.value }))} /></Fl>
            <Fl label="Lote"><input type="text" className={IC} value={qRem.lote} onChange={e => setQRem(r => ({ ...r, lote: e.target.value }))} /></Fl>
            <Fl label="Observaciones"><input type="text" className={IC} value={qRem.obs} onChange={e => setQRem(r => ({ ...r, obs: e.target.value }))} /></Fl>
          </div>
          <FBtns onSave={saveQRem} onCancel={() => setQRem(null)} saveLabel="Generar Remito" />
        </Modal>
      )}

      {qFac && (
        <Modal title={`Nueva Factura - ${qFac.opId}`} onClose={() => setQFac(null)}>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-4 text-sm text-violet-700">
            Pendiente de factura: <strong>{qFac.cantidad} unidades</strong> - podes facturar menos si el cliente lo solicita.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={qFac.fecha} onChange={e => setQFac(f => ({ ...f, fecha: e.target.value }))} /></Fl>
            <Fl label="Cantidad a facturar"><input type="number" className={IC} value={qFac.cantidad} onChange={e => setQFac(f => ({ ...f, cantidad: e.target.value }))} /></Fl>
            <Fl label="Precio unitario USD"><input type="number" step="0.01" className={IC} value={qFac.precioUnit} onChange={e => setQFac(f => ({ ...f, precioUnit: e.target.value }))} /></Fl>
            <Fl label="IVA %">
              <select className={IC} value={qFac.ivaPct || 21} onChange={e => setQFac(f => ({ ...f, ivaPct: +e.target.value }))}>
                <option value={10.5}>10.5%</option>
                <option value={21}>21%</option>
              </select>
            </Fl>
            <Fl label="Fecha cobro estimada"><input type="date" className={IC} value={qFac.fechaCobro} onChange={e => setQFac(f => ({ ...f, fechaCobro: e.target.value }))} /></Fl>
          </div>
          {num(qFac.cantidad) > 0 && (
            <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-3 text-sm flex justify-between">
              <span className="text-gray-500">Total c/IVA:</span>
              <span className="font-bold text-violet-700">USD {fmt(totalWithIva(num(qFac.cantidad) * num(qFac.precioUnit), qFac.ivaPct))}</span>
            </div>
          )}
          <FBtns onSave={saveQFac} onCancel={() => setQFac(null)} saveLabel="Emitir Factura" />
        </Modal>
      )}

      {qRemGroup && (
        <Modal title={`Remitir Operacion ${qRemGroup.key}`} wide onClose={() => setQRemGroup(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={qRemGroup.fecha} onChange={e => setQRemGroup(g => ({ ...g, fecha: e.target.value }))} /></Fl>
            <Fl label="Lote (opcional)"><input type="text" className={IC} value={qRemGroup.lote || ""} onChange={e => setQRemGroup(g => ({ ...g, lote: e.target.value }))} /></Fl>
            <Fl label="Observaciones" span2><input type="text" className={IC} value={qRemGroup.obs || ""} onChange={e => setQRemGroup(g => ({ ...g, obs: e.target.value }))} /></Fl>
          </div>
          <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <THead cols={["", "Item", "Producto", "Pend.", "Cantidad a remitir"]} />
              <tbody>
                {qRemGroup.items.map((it, idx) => (
                  <TR key={`${it.opId}-${idx}`} highlight={it.selected}>
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={!!it.selected}
                        disabled={it.max <= 0}
                        onChange={e => setQRemGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x) }))}
                      />
                    </td>
                    <TD mono gray>{it.opId}</TD>
                    <TD>{it.producto}</TD>
                    <TD right>{it.max}</TD>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        className={IC}
                        value={it.cantidad}
                        min={0}
                        max={it.max}
                        disabled={!it.selected || it.max <= 0}
                        onChange={e => setQRemGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, cantidad: e.target.value } : x) }))}
                      />
                    </td>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
          <FBtns onSave={saveQRemGroup} onCancel={() => setQRemGroup(null)} saveLabel="Generar Remitos Seleccionados" />
        </Modal>
      )}

      {qFacGroup && (
        <Modal title={`Facturar Operacion ${qFacGroup.key}`} wide onClose={() => setQFacGroup(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={qFacGroup.fecha} onChange={e => setQFacGroup(g => ({ ...g, fecha: e.target.value }))} /></Fl>
            <Fl label="Fecha cobro estimada"><input type="date" className={IC} value={qFacGroup.fechaCobro || ""} onChange={e => setQFacGroup(g => ({ ...g, fechaCobro: e.target.value }))} /></Fl>
          </div>
          <div className="mt-4 border border-slate-100 rounded-xl overflow-x-auto overflow-y-hidden">
            <table className="w-full text-xs table-fixed min-w-[980px]">
            <colgroup>
              <col style={{ width: "7%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <THead cols={["", "Item", "Producto", "Pend. Facturar", "Precio", "IVA %", "Cantidad"]} />
            <tbody>
              {qFacGroup.items.map((it, idx) => (
                <TR key={`${it.opId}-${idx}`} highlight={it.selected}>
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={!!it.selected}
                        disabled={it.max <= 0}
                        onChange={e => setQFacGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x) }))}
                      />
                    </td>
                    <TD mono gray>{it.opId}</TD>
                    <TD>{it.producto}</TD>
                    <TD right>{it.max}</TD>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        className={`${IC_COMPACT} compact-number`}
                        value={it.precio}
                        disabled={!it.selected || it.max <= 0}
                        onChange={e => setQFacGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, precio: e.target.value } : x) }))}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        className={`${IC_COMPACT} pr-6`}
                        value={it.ivaPct || 21}
                        disabled={!it.selected || it.max <= 0}
                        onChange={e => setQFacGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, ivaPct: +e.target.value } : x) }))}
                      >
                        <option value={10.5}>10.5%</option>
                        <option value={21}>21%</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        className={`${IC_COMPACT} compact-number`}
                        value={it.cantidad}
                        min={0}
                        max={it.max}
                        disabled={!it.selected || it.max <= 0}
                        onChange={e => setQFacGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, cantidad: e.target.value } : x) }))}
                      />
                    </td>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
          <FBtns onSave={saveQFacGroup} onCancel={() => setQFacGroup(null)} saveLabel="Generar Facturas Seleccionadas" />
        </Modal>
      )}

      {qRec && (
        <Modal title={`Registrar Cobro - ${qRec._opId}`} onClose={() => setQRec(null)}>
          {(() => {
            const opIds = Array.isArray(qRec._opIds) && qRec._opIds.length ? qRec._opIds : [qRec._opId];
            const facList = facturas.filter((f) => opIds.includes(f.opId));
            return (
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={qRec.fecha} onChange={e => setQRec(r => ({ ...r, fecha: e.target.value }))} /></Fl>
            <Fl label="Factura asociada">
              <select className={IC} value={qRec.facturaId} onChange={e => setQRec(r => ({ ...r, facturaId: e.target.value }))}>
                <option value="">Sin vincular</option>
                {facList
                  .map(f => <option key={f.id} value={f.id}>{f.id} - saldo USD {fmt(facSaldo(f, recibos, productos))}</option>)}
              </select>
            </Fl>
            <Fl label="Moneda">
              <select className={IC} value={qRec.moneda} onChange={e => setQRec(r => ({ ...r, moneda: e.target.value }))}>
                <option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option>
              </select>
            </Fl>
            <Fl label="Tipo de Cambio"><input type="number" className={IC} value={qRec.tc} onChange={e => setQRec(r => ({ ...r, tc: e.target.value }))} /></Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={IC} value={qRec.monto} onChange={e => setQRec(r => ({ ...r, monto: e.target.value }))} /></Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={qRec.medioPago} onChange={e => setQRec(r => ({ ...r, medioPago: e.target.value }))}>
                {["EFECTIVO","TRANSFERENCIA","TARJETA","CHEQUE"].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fl>
            <Fl label="Concepto" span2><input type="text" className={IC} value={qRec.concepto} onChange={e => setQRec(r => ({ ...r, concepto: e.target.value }))} /></Fl>
          </div>
            );
          })()}
          <FBtns onSave={saveQRec} onCancel={() => setQRec(null)} saveLabel="Registrar Cobro" />
        </Modal>
      )}
    </div>
  );
}

// â”€â”€â”€ FACTURACION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Facturacion({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandId, setExpandId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const { facturas, operaciones, remitos, recibos, productos, clientes, vendedores } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const clientesPorVendedor = form.vendedorId
    ? clientes.filter((c) => !hasValue(c.vendedorId) || +c.vendedorId === +form.vendedorId)
    : clientes;
  const operacionesFiltradas = operaciones.filter((o) => {
    if (form.vendedorId && +o.vendedorId !== +form.vendedorId) return false;
    if (form.clienteId && +o.clienteId !== +form.clienteId) return false;
    return true;
  });

  const openNew = () => {
    setEditId(null);
    setForm({
      fecha: today(),
      vendedorId: "",
      clienteId: "",
      opId: "",
      productoId: "",
      cantidad: "",
      precioUnit: "",
      ivaPct: 21,
      fechaCobro: "",
      cobrado: 0,
    });
    setModal(true);
  };
  const openEdit = (f) => {
    const op = operaciones.find((o) => o.id === f.opId);
    setEditId(f.id);
    setForm({
      ...f,
      vendedorId: f.vendedorId || op?.vendedorId || "",
      clienteId: f.clienteId || op?.clienteId || "",
      ivaPct: facturaIvaPct(f, productos),
    });
    setModal(true);
  };
  const del = (id) => { if (confirm("Eliminar?")) onUpdate("facturas", facturas.filter(f => f.id !== id)); };
  const delGroup = (group) => {
    if (!confirm(`Eliminar factura ${group.key} completa con ${group.lines.length} items?`)) return;
    const ids = new Set(group.lines.map((x) => x.id));
    onUpdate("facturas", facturas.filter((f) => !ids.has(f.id)));
  };

  const save = () => {
    if (!form.fecha || !form.opId || !form.cantidad) return alert("Completa los campos requeridos.");
    const op = operaciones.find(o => o.id === form.opId);
    if (!op) return alert("Selecciona una operacion valida.");
    const qty = num(form.cantidad);
    if (qty <= 0) return alert("La cantidad debe ser mayor a 0.");
    const facturadoSinActual = facturas
      .filter(f => f.opId === form.opId && f.id !== editId)
      .reduce((s, f) => s + num(f.cantidad), 0);
    const disponible = Math.max(0, num(op.cantidad) - facturadoSinActual);
    if (qty > disponible) return alert(`No podes facturar mas de lo pendiente (${disponible} u.).`);

    const rec = {
      ...form,
      cantidad: qty,
      precioUnit: +form.precioUnit,
      cobrado: +form.cobrado || 0,
      productoId: +form.productoId,
      ivaPct: ivaPct(form.ivaPct),
      clienteId: op.clienteId || null,
      vendedorId: op.vendedorId || null,
    };
    if (editId) { rec.id = editId; onUpdate("facturas", facturas.map(f => f.id === editId ? rec : f)); }
    else {
      const n = data.cnt.fac + 1;
      rec.id = `F_${pad4(n)}`;
      rec.facBaseId = rec.id;
      rec.facLine = 1;
      onUpdate("facturas", [...facturas, rec]);
      onUpdate("cnt", { ...data.cnt, fac: n });
    }
    setModal(false);
  };
  const total = totalWithIva(num(form.cantidad) * num(form.precioUnit), form.ivaPct);
  const opSel = operaciones.find(o => o.id === form.opId);
  const comprometidoSel = opSel ? num(opSel.cantidad) : 0;
  const facturadoSel = opSel
    ? facturas.filter(f => f.opId === opSel.id && f.id !== editId).reduce((s, f) => s + num(f.cantidad), 0)
    : 0;
  const disponibleSel = Math.max(0, comprometidoSel - facturadoSel);

  const facturaGroupMap = new Map();
  const facturaGroups = [];
  for (const f of facturas) {
    const key = facturaBaseId(f);
    if (!facturaGroupMap.has(key)) {
      const g = { key, lines: [] };
      facturaGroupMap.set(key, g);
      facturaGroups.push(g);
    }
    facturaGroupMap.get(key).lines.push(f);
  }
  for (const g of facturaGroups) {
    g.lines.sort((a, b) => facturaLineNo(a) - facturaLineNo(b));
    g.head = g.lines[0];
    g.multi = g.lines.length > 1;
    g.cantidad = g.lines.reduce((s, x) => s + num(x.cantidad), 0);
    g.total = g.lines.reduce((s, x) => s + facTotal(x, productos), 0);
    g.cobrado = g.lines.reduce((s, x) => s + facturaCobradaUSD(x, recibos), 0);
    g.saldo = Math.max(0, g.total - g.cobrado);
    g.opLabel = g.multi
      ? `${g.lines.length} items`
      : g.head.opId;
    g.producto = g.multi
      ? `${g.lines.length} productos`
      : lookupNombre(productos, g.head.productoId);
    g.precio = g.multi ? "-" : fmt(g.head.precioUnit);
    const ivaSet = Array.from(new Set(g.lines.map((x) => facturaIvaPct(x, productos))));
    g.iva = ivaSet.length === 1 ? `${fmt(ivaSet[0], 1)}%` : "Mixto";
    const clienteId = g.head.clienteId || operaciones.find((o) => o.id === g.head.opId)?.clienteId;
    g.cliente = lookupNombre(clientes, clienteId);
    g.vence = g.lines
      .map((x) => x.fechaCobro)
      .filter(Boolean)
      .sort()[0] || "";
    if (g.saldo <= 0.01) g.estado = "Pagado";
    else if (g.cobrado > 0) g.estado = "Parcial";
    else if (g.lines.some((x) => x.fechaCobro && new Date(x.fechaCobro) < new Date())) g.estado = "Vencido";
    else g.estado = "Pendiente";
  }
  const filteredFacturas = facturaGroups.filter((g) => inDateRange(g.head?.fecha, dateRange));

  return (
    <div>
      <PageHdr title="Facturacion" sub="La cantidad facturada es independiente del remito (sin superar la operacion)." onNew={openNew} btn="+ Nueva Factura" />
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredFacturas.length} total={facturaGroups.length} />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["","ID","Fecha","Operacion","Cliente","Producto","Cant.","Precio","IVA","Total c/IVA","Cobrado","Saldo","Vence","Estado",""]} />
          <tbody>
            {filteredFacturas.map(group => {
              const exp = expandId === group.key;
              return (
                <Fragment key={group.key}>
                  <TR>
                    <td className="px-1 py-1.5 align-middle text-center">
                      {group.multi ? (
                        <button
                          onClick={() => setExpandId(exp ? null : group.key)}
                          className="px-1.5 py-0.5 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          {exp ? "Ocultar" : "Detalle"}
                        </button>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <TD mono><span className="text-emerald-700 font-bold">{group.key}</span></TD>
                    <TD>{fmtD(group.head.fecha)}</TD>
                    <TD mono gray>{group.opLabel}</TD>
                    <TD bold>{group.cliente}</TD>
                    <TD>{group.producto}</TD>
                    <TD right>{group.cantidad}</TD>
                    <TD right>{group.precio}</TD>
                    <TD>{group.iva}</TD>
                    <TD right bold>USD {fmt(group.total)}</TD>
                    <TD right gray>{fmt(group.cobrado)}</TD>
                    <TD right bold>USD {fmt(group.saldo)}</TD>
                    <TD gray>{fmtD(group.vence)}</TD>
                    <td className="px-4 py-2.5"><Bdg s={group.estado} /></td>
                    {group.multi
                      ? (
                        <td className="px-1.5 py-1.5 align-middle text-center">
                          <button onClick={() => delGroup(group)} className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Eliminar factura">
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </td>
                      )
                      : <Btns onEdit={() => openEdit(group.head)} onDel={() => del(group.head.id)} />}
                  </TR>
                  {exp && (
                    <tr className="bg-slate-50 border-b border-gray-100">
                      <td colSpan={15} className="px-8 py-4">
                        <table className="w-full text-xs">
                          <THead cols={["ID","Operacion","Producto","Cant.","Precio","IVA","Total","Cobrado","Saldo","Vence","Estado",""]} />
                          <tbody>
                            {group.lines.map((f) => {
                              const totalL = facTotal(f, productos);
                              const cobradoL = facturaCobradaUSD(f, recibos);
                              const saldoL = facSaldo(f, recibos, productos);
                              const stL = facStatus(f, recibos, productos);
                              return (
                                <TR key={f.id}>
                                  <TD mono gray>{f.id}</TD>
                                  <TD mono gray>{f.opId}</TD>
                                  <TD>{lookupNombre(productos, f.productoId)}</TD>
                                  <TD right>{f.cantidad}</TD>
                                  <TD right>{fmt(f.precioUnit)}</TD>
                                  <TD>{fmt(facturaIvaPct(f, productos), 1)}%</TD>
                                  <TD right bold>USD {fmt(totalL)}</TD>
                                  <TD right gray>{fmt(cobradoL)}</TD>
                                  <TD right bold>USD {fmt(saldoL)}</TD>
                                  <TD gray>{fmtD(f.fechaCobro)}</TD>
                                  <td className="px-4 py-2.5"><Bdg s={stL} /></td>
                                  <Btns compact onEdit={() => openEdit(f)} onDel={() => del(f.id)} />
                                </TR>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!filteredFacturas.length && <EmptyRow cols={15} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId ? "Editar Factura" : "Nueva Factura"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Vendedor">
              <select
                className={IC}
                value={form.vendedorId || ""}
                onChange={e => setForm((prev) => {
                  const vendedorId = e.target.value;
                  const permitidos = vendedorId
                    ? clientes.filter((c) => !hasValue(c.vendedorId) || +c.vendedorId === +vendedorId)
                    : clientes;
                  const clienteId = permitidos.some((c) => +c.id === +prev.clienteId) ? prev.clienteId : "";
                  return { ...prev, vendedorId, clienteId, opId: "", productoId: "", cantidad: "", precioUnit: "" };
                })}
              >
                <option value="">Todos</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </Fl>
            <Fl label="Cliente">
              <SelCliente
                val={form.clienteId}
                onChange={e => setForm((prev) => ({ ...prev, clienteId: e.target.value, opId: "", productoId: "", cantidad: "", precioUnit: "" }))}
                clientes={clientesPorVendedor}
              />
            </Fl>
            <Fl label="Operacion *">
              <select className={IC} value={form.opId || ""} onChange={e => {
                const op = operaciones.find(o => o.id === e.target.value);
                const tracks = op ? opTracks(op, facturas, remitos, recibos, productos) : null;
                const prod = productoById(productos, op?.productoId);
                setForm(f => ({
                  ...f,
                  opId: e.target.value,
                  vendedorId: op?.vendedorId || f.vendedorId || "",
                  clienteId: op?.clienteId || f.clienteId || "",
                  productoId: op?.productoId || "",
                  precioUnit: op?.precio || "",
                  ivaPct: prod?.iva || 21,
                  cantidad: tracks ? Math.max(0, num(op?.cantidad) - tracks.facturado) : "",
                }));
              }}>
                <option value="">Seleccionar...</option>
                {operacionesFiltradas.map(o => {
                  const tracks = opTracks(o, facturas, remitos, recibos, productos);
                  const pend = Math.max(0, num(o.cantidad) - tracks.facturado);
                  return (
                    <option key={o.id} value={o.id}>
                      {opSelectLabel(o, data.clientes, productos)} - pend. {pend} u.
                    </option>
                  );
                })}
              </select>
            </Fl>
            <Fl label="Producto"><SelProd val={form.productoId} onChange={e => sf("productoId", e.target.value)} productos={productos} /></Fl>
            <Fl label="Cantidad *"><input type="number" className={IC} value={form.cantidad || ""} onChange={e => sf("cantidad", e.target.value)} /></Fl>
            <Fl label="Precio Unitario USD"><input type="number" step="0.01" className={IC} value={form.precioUnit || ""} onChange={e => sf("precioUnit", e.target.value)} /></Fl>
            <Fl label="IVA %">
              <select className={IC} value={form.ivaPct || 21} onChange={e => sf("ivaPct", +e.target.value)}>
                <option value={10.5}>10.5%</option>
                <option value={21}>21%</option>
              </select>
            </Fl>
            <Fl label="Fecha Cobro Estimada"><input type="date" className={IC} value={form.fechaCobro || ""} onChange={e => sf("fechaCobro", e.target.value)} /></Fl>
            <Fl label="Ajuste cobrado USD"><input type="number" step="0.01" className={IC} value={form.cobrado || ""} onChange={e => sf("cobrado", e.target.value)} /></Fl>
          </div>
          {form.opId && (
            <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-3 text-sm text-violet-700">
              Pendiente de facturar en esta operacion: <strong>{disponibleSel} u.</strong>
            </div>
          )}
          {total > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Subtotal</p><p className="font-bold">USD {fmt(facSubtotal(form))}</p></div>
              <div><p className="text-xs text-gray-400">IVA {fmt(ivaPct(form.ivaPct), 1)}%</p><p className="font-bold">USD {fmt(ivaAmount(facSubtotal(form), form.ivaPct))}</p></div>
              <div><p className="text-xs text-gray-400">Total c/IVA</p><p className="font-bold text-blue-700 text-lg">USD {fmt(total)}</p></div>
            </div>
          )}
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// â”€â”€â”€ REMITOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Remitos({ data, onUpdate, navTarget }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const rowRefs = useRef({});
  const { remitos, operaciones, facturas, recibos, productos, clientes } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm({ fecha: today(), opId: "", productoId: "", cantidad: "", obs: "", lote: "" }); setModal(true); };
  const openEdit = (r) => { setEditId(r.id); setForm({ ...r }); setModal(true); };
  const del = (id) => { if (confirm("Eliminar?")) onUpdate("remitos", remitos.filter(r => r.id !== id)); };
  const save = () => {
    if (!form.fecha || !form.opId || !form.cantidad) return alert("Completa los campos requeridos.");
    const op = operaciones.find(o => o.id === form.opId);
    if (!op) return alert("Selecciona una operacion valida.");
    const qty = num(form.cantidad);
    if (qty <= 0) return alert("La cantidad debe ser mayor a 0.");
    const remitadoSinActual = remitos
      .filter(r => r.opId === form.opId && r.id !== editId)
      .reduce((s, r) => s + num(r.cantidad), 0);
    const disponible = Math.max(0, num(op.cantidad) - remitadoSinActual);
    if (qty > disponible) return alert(`No podes remitar mas de lo comprometido pendiente (${disponible} u.).`);

    const rec = { ...form, cantidad: qty, productoId: +form.productoId };
    if (editId) { rec.id = editId; onUpdate("remitos", remitos.map(r => r.id === editId ? rec : r)); }
    else {
      const n = data.cnt.rem + 1; rec.id = `R-${pad4(n)}`;
      onUpdate("remitos", [...remitos, rec]);
      onUpdate("cnt", { ...data.cnt, rem: n });
    }
    setModal(false);
  };

  useEffect(() => {
    if (navTarget?.module !== "remitos" || !navTarget?.id) return;
    const id = String(navTarget.id);
    const t0 = setTimeout(() => {
      rowRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => {
      clearTimeout(t0);
    };
  }, [navTarget?.module, navTarget?.id]);

  const filteredRemitos = remitos.filter((r) => inDateRange(r.fecha, dateRange));
  return (
    <div>
      <PageHdr title="Remitos" sub="Entregas fisicas - independientes de la facturacion" onNew={openNew} btn="+ Nuevo Remito" />
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredRemitos.length} total={remitos.length} />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID","Fecha","Operacion","Cliente","Producto","Cantidad","Lote","Obs.",""]} />
          <tbody>
            {filteredRemitos.map(r => {
              const op = operaciones.find(o => o.id === r.opId);
              return (
                <TR
                  key={r.id}
                  highlight={navTarget?.module === "remitos" && String(navTarget?.id) === String(r.id)}
                  rowRef={(el) => { rowRefs.current[r.id] = el; }}
                >
                  <TD mono><span className="text-emerald-700 font-bold">{r.id}</span></TD>
                  <TD>{fmtD(r.fecha)}</TD>
                  <TD mono gray>{r.opId}</TD>
                  <TD bold>{op ? lookupNombre(clientes, op.clienteId) : "-"}</TD>
                  <TD>{lookupNombre(productos, r.productoId)}</TD>
                  <TD right bold green>{r.cantidad} u.</TD>
                  <TD gray>{r.lote || "-"}</TD>
                  <TD gray>{r.obs || "-"}</TD>
                  <Btns onEdit={() => openEdit(r)} onDel={() => del(r.id)} />
                </TR>
              );
            })}
            {!filteredRemitos.length && <EmptyRow cols={9} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId ? "Editar Remito" : "Nuevo Remito"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Operacion *">
              <select className={IC} value={form.opId || ""} onChange={e => {
                const op = operaciones.find(o => o.id === e.target.value);
                const tracks = op ? opTracks(op, facturas, remitos, recibos, productos) : null;
                setForm(f => ({ ...f, opId: e.target.value, productoId: op?.productoId || "", cantidad: tracks ? tracks.pendEntrega : "" }));
              }}>
                <option value="">Seleccionar...</option>
                {operaciones.map(o => {
                  const tracks = opTracks(o, facturas, remitos, recibos, productos);
                  return (
                    <option key={o.id} value={o.id}>
                      {opSelectLabel(o, data.clientes, productos)} - pend. {tracks.pendEntrega} u.
                    </option>
                  );
                })}
              </select>
            </Fl>
            <Fl label="Producto"><SelProd val={form.productoId} onChange={e => sf("productoId", e.target.value)} productos={productos} /></Fl>
            <Fl label="Cantidad *"><input type="number" className={IC} value={form.cantidad || ""} onChange={e => sf("cantidad", e.target.value)} /></Fl>
            <Fl label="Lote"><input type="text" className={IC} value={form.lote || ""} onChange={e => sf("lote", e.target.value)} /></Fl>
            <Fl label="Observaciones"><input type="text" className={IC} value={form.obs || ""} onChange={e => sf("obs", e.target.value)} /></Fl>
          </div>
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// â”€â”€â”€ RECIBOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Recibos({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const { recibos, facturas, operaciones, clientes, productos } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const facturaClienteId = (facturaId) => {
    const fac = facturas.find(f => f.id === facturaId);
    if (fac && hasValue(fac.clienteId)) return +fac.clienteId;
    const op = fac ? operaciones.find(o => o.id === fac.opId) : null;
    return op?.clienteId || "";
  };
  const openNew = () => { setEditId(null); setForm({ fecha: today(), clienteId: "", facturaId: "", concepto: "", monto: "", moneda: "PESOS", tc: 1400, medioPago: "EFECTIVO" }); setModal(true); };
  const openEdit = (r) => { setEditId(r.id); setForm({ ...r }); setModal(true); };
  const del = (id) => { if (confirm("Eliminar?")) onUpdate("recibos", recibos.filter(r => r.id !== id)); };
  const save = () => {
    if (!form.fecha || !form.monto) return alert("Completa Fecha y Monto.");
    const monto = num(form.monto);
    if (monto <= 0) return alert("El monto debe ser mayor a 0.");

    let clienteId = hasValue(form.clienteId) ? +form.clienteId : null;
    if (form.facturaId) {
      const fac = facturas.find(f => f.id === form.facturaId);
      if (!fac) return alert("La factura seleccionada no existe.");
      const clienteFactura = facturaClienteId(form.facturaId);
      if (clienteFactura) clienteId = +clienteFactura;
      const saldo = facSaldo(fac, recibos.filter(r => r.id !== editId), productos);
      const usd = moneyToUSD(monto, form.moneda, form.tc);
      if (usd > saldo + 0.01) return alert(`El cobro supera el saldo pendiente de la factura (USD ${fmt(saldo)}).`);
    }

    const rec = { ...form, clienteId, monto, tc: +form.tc };
    if (editId) { rec.id = editId; onUpdate("recibos", recibos.map(r => r.id === editId ? rec : r)); }
    else {
      const n = data.cnt.rec + 1; rec.id = `RC_${pad4(n)}`;
      onUpdate("recibos", [...recibos, rec]);
      onUpdate("cnt", { ...data.cnt, rec: n });
    }
    setModal(false);
  };
  const montoUSD = moneyToUSD(form.monto, form.moneda, form.tc);
  const facturaSel = form.facturaId ? facturas.find(f => f.id === form.facturaId) : null;
  const saldoFacturaSel = facturaSel ? facSaldo(facturaSel, recibos.filter(r => r.id !== editId), productos) : 0;
  const filteredRecibos = recibos.filter((r) => inDateRange(r.fecha, dateRange));
  return (
    <div>
      <PageHdr title="Recibos de Cobro" sub="Pagos recibidos de clientes" onNew={openNew} btn="+ Nuevo Recibo" />
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredRecibos.length} total={recibos.length} />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID","Fecha","Cliente","Factura","Concepto","Monto","Moneda","T/C","USD equiv.","Medio Pago",""]} />
          <tbody>
            {filteredRecibos.map(r => {
              const usd = reciboUSD(r);
              return (
                <TR key={r.id}>
                  <TD mono><span className="text-emerald-700 font-bold">{r.id}</span></TD>
                  <TD>{fmtD(r.fecha)}</TD>
                  <TD bold>{lookupNombre(clientes, r.clienteId)}</TD>
                  <TD mono gray>{r.facturaId || "-"}</TD>
                  <TD gray>{r.concepto || "-"}</TD>
                  <TD right bold>{fmt(r.monto, 0)}</TD>
                  <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.moneda === "DOLAR" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{r.moneda}</span></td>
                  <TD right gray>{fmt(r.tc, 0)}</TD>
                  <TD right green>USD {fmt(usd)}</TD>
                  <TD gray>{r.medioPago}</TD>
                  <Btns onEdit={() => openEdit(r)} onDel={() => del(r.id)} />
                </TR>
              );
            })}
            {!filteredRecibos.length && <EmptyRow cols={11} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId ? "Editar Recibo" : "Nuevo Recibo"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Cliente (opcional)"><SelCliente val={form.clienteId} onChange={e => sf("clienteId", e.target.value)} clientes={clientes} /></Fl>
            <Fl label="Factura asociada">
              <select className={IC} value={form.facturaId || ""} onChange={e => {
                const facturaId = e.target.value;
                const clienteId = facturaId ? facturaClienteId(facturaId) : form.clienteId;
                setForm(f => ({ ...f, facturaId, clienteId: clienteId || f.clienteId }));
              }}>
                <option value="">Sin vincular</option>
                {facturas
                  .filter((f) => {
                    if (form.clienteId) {
                      const cli = facturaClienteId(f.id);
                      if (+cli !== +form.clienteId && f.id !== form.facturaId) return false;
                    }
                    return facSaldo(f, recibos.filter(r => r.id !== editId), productos) > 0.01 || f.id === form.facturaId;
                  })
                  .map(f => <option key={f.id} value={f.id}>{f.id} - saldo USD {fmt(facSaldo(f, recibos.filter(r => r.id !== editId), productos))}</option>)}
              </select>
            </Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={form.medioPago || "EFECTIVO"} onChange={e => sf("medioPago", e.target.value)}>
                {["EFECTIVO","TRANSFERENCIA","TARJETA","CHEQUE"].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fl>
            <Fl label="Moneda"><select className={IC} value={form.moneda || "PESOS"} onChange={e => sf("moneda", e.target.value)}><option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option></select></Fl>
            <Fl label="Tipo de Cambio"><input type="number" className={IC} value={form.tc || ""} onChange={e => sf("tc", e.target.value)} /></Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={IC} value={form.monto || ""} onChange={e => sf("monto", e.target.value)} /></Fl>
            <Fl label="Concepto"><input type="text" className={IC} value={form.concepto || ""} onChange={e => sf("concepto", e.target.value)} /></Fl>
          </div>
          {facturaSel && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
              Saldo pendiente de la factura: <strong>USD {fmt(saldoFacturaSel)}</strong>
            </div>
          )}
          {num(form.monto) > 0 && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex justify-between text-sm">
              <span className="text-gray-500">Equivalente USD:</span>
              <span className="font-bold text-emerald-700 text-lg">USD {fmt(montoUSD)}</span>
            </div>
          )}
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// â”€â”€â”€ COMPRAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Compras({ data, onUpdate, navTarget }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const rowRefs = useRef({});
  const { compras, proveedores, productos } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm({ fecha: today(), proveedorId: "", productoId: "", cantidad: "", precio: "", moneda: "USD", entregaEst: "", recepcion: "", cantRecibida: 0, pagado: 0, medioPago: "" }); setModal(true); };
  const openEdit = (c) => { setEditId(c.id); setForm({ ...c }); setModal(true); };
  const del = (id) => { if (confirm("Eliminar?")) onUpdate("compras", compras.filter(c => c.id !== id)); };
  const save = () => {
    if (!form.fecha || !form.proveedorId || !form.cantidad) return alert("Completa los campos requeridos.");
    const rec = { ...form, proveedorId: +form.proveedorId, productoId: +form.productoId, cantidad: +form.cantidad, precio: +form.precio, cantRecibida: +form.cantRecibida || 0, pagado: +form.pagado || 0 };
    if (editId) { rec.id = editId; onUpdate("compras", compras.map(c => c.id === editId ? rec : c)); }
    else {
      const n = data.cnt.oc + 1; rec.id = `OC_${pad4(n)}`;
      onUpdate("compras", [...compras, rec]);
      onUpdate("cnt", { ...data.cnt, oc: n });
    }
    setModal(false);
  };

  useEffect(() => {
    if (navTarget?.module !== "compras" || !navTarget?.id) return;
    const id = String(navTarget.id);
    const t0 = setTimeout(() => {
      rowRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => {
      clearTimeout(t0);
    };
  }, [navTarget?.module, navTarget?.id]);

  const total = num(form.cantidad) * num(form.precio);
  const filteredCompras = compras.filter((c) => inDateRange(c.fecha, dateRange));
  return (
    <div>
      <PageHdr title="Compras y Abastecimiento" sub="Ordenes de compra a proveedores" onNew={openNew} btn="+ Nueva Compra" />
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredCompras.length} total={compras.length} />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID","Fecha","Proveedor","Producto","Cant.","Precio","Total","Recibido","Pagado","Saldo","Estado",""]} />
          <tbody>
            {filteredCompras.map(c => {
              const total = num(c.cantidad) * num(c.precio), saldo = total - num(c.pagado), st = compraStatus(c);
              return (
                <TR
                  key={c.id}
                  highlight={navTarget?.module === "compras" && String(navTarget?.id) === String(c.id)}
                  rowRef={(el) => { rowRefs.current[c.id] = el; }}
                >
                  <TD mono><span className="text-emerald-700 font-bold">{c.id}</span></TD>
                  <TD>{fmtD(c.fecha)}</TD>
                  <TD bold>{lookupNombre(proveedores, c.proveedorId)}</TD>
                  <TD>{lookupNombre(productos, c.productoId)}</TD>
                  <TD right>{c.cantidad}</TD>
                  <TD right>{fmt(c.precio)} {c.moneda}</TD>
                  <TD right bold>{fmt(total)} {c.moneda}</TD>
                  <TD right gray>{c.cantRecibida}/{c.cantidad}</TD>
                  <TD right gray>{fmt(c.pagado)}</TD>
                  <TD right bold>{fmt(saldo)}</TD>
                  <td className="px-4 py-2.5"><Bdg s={st} /></td>
                  <Btns onEdit={() => openEdit(c)} onDel={() => del(c.id)} />
                </TR>
              );
            })}
            {!filteredCompras.length && <EmptyRow cols={12} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId ? "Editar Compra" : "Nueva Orden de Compra"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha||""} onChange={e=>sf("fecha",e.target.value)} /></Fl>
            <Fl label="Proveedor *">
              <select className={IC} value={form.proveedorId||""} onChange={e=>sf("proveedorId",e.target.value)}>
                <option value="">Seleccionar...</option>
                {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Fl>
            <Fl label="Producto *">
              <SelProd val={form.productoId} onChange={e=>{ const p=productos.find(pr=>pr.id===+e.target.value); setForm(f=>({...f,productoId:e.target.value,precio:p?.costo||""})); }} productos={productos} />
            </Fl>
            <Fl label="Cantidad *"><input type="number" className={IC} value={form.cantidad||""} onChange={e=>sf("cantidad",e.target.value)} /></Fl>
            <Fl label="Precio Compra"><input type="number" step="0.01" className={IC} value={form.precio||""} onChange={e=>sf("precio",e.target.value)} /></Fl>
            <Fl label="Moneda"><select className={IC} value={form.moneda||"USD"} onChange={e=>sf("moneda",e.target.value)}><option>USD</option><option>PESOS</option></select></Fl>
            <Fl label="Entrega Estimada"><input type="date" className={IC} value={form.entregaEst||""} onChange={e=>sf("entregaEst",e.target.value)} /></Fl>
            <Fl label="Fecha Recepcion"><input type="date" className={IC} value={form.recepcion||""} onChange={e=>sf("recepcion",e.target.value)} /></Fl>
            <Fl label="Cantidad Recibida"><input type="number" className={IC} value={form.cantRecibida||""} onChange={e=>sf("cantRecibida",e.target.value)} /></Fl>
            <Fl label="Monto Pagado"><input type="number" step="0.01" className={IC} value={form.pagado||""} onChange={e=>sf("pagado",e.target.value)} /></Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={form.medioPago||""} onChange={e=>sf("medioPago",e.target.value)}>
                <option value="">Seleccionar...</option>
                {["EFECTIVO","TRANSFERENCIA","TARJETA","CHEQUE"].map(m=><option key={m}>{m}</option>)}
              </select>
            </Fl>
          </div>
          {total > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Total</p><p className="font-bold">{fmt(total)} {form.moneda}</p></div>
              <div><p className="text-xs text-gray-400">Pagado</p><p className="font-bold">{fmt(form.pagado||0)}</p></div>
              <div><p className="text-xs text-gray-400">Saldo</p><p className="font-bold text-amber-700">{fmt(total-(num(form.pagado)||0))}</p></div>
            </div>
          )}
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// â”€â”€â”€ STOCK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Stock({ data, onNavigate }) {
  const { productos, compras, remitos } = data;
  const movimientos = [
    ...compras
      .filter((c) => num(c.cantRecibida) > 0)
      .map((c, idx) => ({
        id: `IN-${c.id}-${idx}`,
        fecha: c.recepcion || c.fecha,
        tipo: "entrada",
        origen: "compra",
        refId: c.id,
        productoId: c.productoId,
        cantidad: num(c.cantRecibida),
      })),
    ...remitos
      .filter((r) => num(r.cantidad) > 0)
      .map((r, idx) => ({
        id: `OUT-${r.id}-${idx}`,
        fecha: r.fecha,
        tipo: "salida",
        origen: "remito",
        refId: r.id,
        productoId: r.productoId,
        cantidad: num(r.cantidad),
      })),
  ]
    .sort((a, b) => {
      if ((b.fecha || "") !== (a.fecha || "")) return (b.fecha || "").localeCompare(a.fecha || "");
      return (b.refId || "").localeCompare(a.refId || "");
    })
    .slice(0, 120);

  const goToMovimiento = (m) => {
    if (!onNavigate) return;
    if (m.origen === "compra") onNavigate("compras", m.refId);
    if (m.origen === "remito") onNavigate("remitos", m.refId);
  };

  return (
    <div>
      <PageHdr title="Control de Stock" sub="Entradas desde Compras, salidas desde Remitos" />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["Producto","Tipo","Entradas","Salidas","Stock Actual","Precio Venta","Estado","Alerta"]} />
          <tbody>
            {productos.map(p => {
              const ent = compras.filter(c=>+c.productoId===p.id).reduce((s,c)=>s+num(c.cantRecibida),0);
              const sal = remitos.filter(r=>+r.productoId===p.id).reduce((s,r)=>s+num(r.cantidad),0);
              const stock = ent-sal, st = stockStatus(stock);
              return (
                <TR key={p.id}>
                  <TD bold>{p.nombre}</TD><TD gray>{p.tipo}</TD>
                  <TD right green>+{ent}</TD><TD right red>-{sal}</TD>
                  <TD right bold>{stock}</TD>
                  <TD right>USD {fmt(p.precio)}</TD>
                  <td className="px-4 py-2.5"><Bdg s={st} /></td>
                  <TD gray>{stock<=20 ? (stock<0?"Comprar urgente":"Reponer pronto") : "Suficiente"}</TD>
                </TR>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Card className="mt-5">
        <div className="px-5 pt-4 pb-2 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-700 text-sm">Historial de Movimientos de Stock</h2>
          <span className="text-xs text-gray-400">{movimientos.length} movimientos</span>
        </div>
        <table className="w-full text-sm">
          <THead cols={["Fecha", "Tipo", "Producto", "Unidades", "Cantidad", "Referencia", ""]} />
          <tbody>
            {movimientos.map((m) => (
              <TR key={m.id}>
                <TD>{fmtD(m.fecha)}</TD>
                <td className="px-4 py-2.5">
                  {m.tipo === "entrada" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                      Entrada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
                      Salida
                    </span>
                  )}
                </td>
                <TD bold>{lookupNombre(productos, m.productoId)}</TD>
                <TD>{m.cantidad} u.</TD>
                <TD bold green={m.tipo === "entrada"} red={m.tipo === "salida"}>
                  {m.tipo === "entrada" ? "+" : "-"}{m.cantidad}
                </TD>
                <TD mono gray>{m.refId}</TD>
                <td className="px-4 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => goToMovimiento(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      m.tipo === "entrada"
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    }`}
                  >
                    Ver operacion
                  </button>
                </td>
              </TR>
            ))}
            {!movimientos.length && <EmptyRow cols={7} />}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// â”€â”€â”€ COSTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Costos({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const { costos } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm({ fecha: today(), concepto: "", monto: "", moneda: "PESOS", medioPago: "", tc: 1400, tipoCosto: "Variable", categoria: "", area: "Comercial", obs: "" }); setModal(true); };
  const openEdit = (c) => { setEditId(c.id); setForm({ ...c }); setModal(true); };
  const del = (id) => { if (confirm("Eliminar?")) onUpdate("costos", costos.filter(c => c.id !== id)); };
  const save = () => {
    if (!form.fecha || !form.concepto || !form.monto) return alert("Completa Fecha, Concepto y Monto.");
    const rec = { ...form, monto: +form.monto, tc: +form.tc || 1 };
    if (editId) { rec.id = editId; onUpdate("costos", costos.map(c => c.id === editId ? rec : c)); }
    else { const n = data.cnt.cos + 1; rec.id = `C-${pad4(n)}`; onUpdate("costos", [...costos, rec]); onUpdate("cnt", { ...data.cnt, cos: n }); }
    setModal(false);
  };
  const totalUSD = costos.reduce((s,c) => s + (c.moneda==="PESOS" ? num(c.monto)/(num(c.tc)||1) : num(c.monto)), 0);
  const filteredCostos = costos.filter((c) => inDateRange(c.fecha, dateRange));
  return (
    <div>
      <PageHdr title="Registro de Costos" sub="Gastos fijos y variables" onNew={openNew} btn="+ Nuevo Costo" />
      <div className="mb-4"><KPI label="Total Costos" value={`USD ${fmt(totalUSD)}`} sub="todos los registros" color="red" icon="costs" /></div>
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredCostos.length} total={costos.length} />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID","Fecha","Concepto","Monto","Moneda","USD equiv.","Tipo","Categoria","Area",""]} />
          <tbody>
            {filteredCostos.map(c => {
              const usd = c.moneda==="PESOS" ? num(c.monto)/(num(c.tc)||1) : num(c.monto);
              return (
                <TR key={c.id}>
                  <TD mono gray>{c.id}</TD><TD>{fmtD(c.fecha)}</TD><TD bold>{c.concepto}</TD>
                  <TD right>{fmt(c.monto,0)}</TD>
                  <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.moneda==="DOLAR"?"bg-emerald-100 text-emerald-700":"bg-blue-100 text-blue-700"}`}>{c.moneda}</span></td>
                  <TD right gray>USD {fmt(usd)}</TD><TD gray>{c.tipoCosto}</TD><TD gray>{c.categoria}</TD><TD gray>{c.area}</TD>
                  <Btns onEdit={()=>openEdit(c)} onDel={()=>del(c.id)} />
                </TR>
              );
            })}
            {!filteredCostos.length && <EmptyRow cols={10} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId?"Editar Costo":"Nuevo Costo"} wide onClose={()=>setModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha||""} onChange={e=>sf("fecha",e.target.value)} /></Fl>
            <Fl label="Concepto *"><input type="text" className={IC} value={form.concepto||""} onChange={e=>sf("concepto",e.target.value)} /></Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={IC} value={form.monto||""} onChange={e=>sf("monto",e.target.value)} /></Fl>
            <Fl label="Moneda"><select className={IC} value={form.moneda||"PESOS"} onChange={e=>sf("moneda",e.target.value)}><option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option></select></Fl>
            <Fl label="Tipo de Cambio"><input type="number" className={IC} value={form.tc||""} onChange={e=>sf("tc",e.target.value)} /></Fl>
            <Fl label="Medio de Pago"><select className={IC} value={form.medioPago||""} onChange={e=>sf("medioPago",e.target.value)}><option value="">Seleccionar...</option>{["EFECTIVO","TRANSFERENCIA","TARJETA","CHEQUE"].map(m=><option key={m}>{m}</option>)}</select></Fl>
            <Fl label="Tipo"><select className={IC} value={form.tipoCosto||"Variable"} onChange={e=>sf("tipoCosto",e.target.value)}><option>Fijo</option><option>Variable</option></select></Fl>
            <Fl label="Categoria"><select className={IC} value={form.categoria||""} onChange={e=>sf("categoria",e.target.value)}><option value="">Seleccionar...</option>{["Fletes","Sueldos","Comisiones","Combustible","Mantenimiento","Impuestos","Alquileres","Otros"].map(m=><option key={m}>{m}</option>)}</select></Fl>
            <Fl label="Area"><select className={IC} value={form.area||"Comercial"} onChange={e=>sf("area",e.target.value)}><option>Comercial</option><option>Administrativa</option><option>Operaciones</option></select></Fl>
            <Fl label="Observaciones"><input type="text" className={IC} value={form.obs||""} onChange={e=>sf("obs",e.target.value)} /></Fl>
          </div>
          <FBtns onSave={save} onCancel={()=>setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// â”€â”€â”€ MAESTROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MaestroCRUD({ title, items, fields, onSave, onDelete }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const fieldValue = (item, field) => {
    if (typeof field.render === "function") return field.render(item[field.key], item);
    if (field.type === "select") {
      const opt = (field.options || []).find((o) => String(o.value) === String(item[field.key]));
      return opt?.label || "-";
    }
    if (item[field.key] == null || item[field.key] === "") return "-";
    return item[field.key];
  };
  const parseInputValue = (field, raw) => {
    if (field.type === "number") return raw === "" ? "" : +raw;
    if (field.type === "select" && field.valueType === "number") return raw === "" ? "" : +raw;
    return raw;
  };
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-700">{title}</h2>
        <button onClick={() => { setEditId(null); setForm({}); setModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">+ Agregar</button>
      </div>
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID", ...fields.map(f => f.label), ""]} />
          <tbody>
            {items.map(item => (
              <TR key={item.id}>
                <TD mono gray>{item.id}</TD>
                {fields.map(f => <TD key={f.key}>{fieldValue(item, f)}</TD>)}
                <Btns onEdit={() => { setEditId(item.id); setForm({ ...item }); setModal(true); }} onDel={() => { if (confirm("Eliminar?")) onDelete(item.id); }} />
              </TR>
            ))}
            {!items.length && <EmptyRow cols={fields.length + 2} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId ? "Editar" : "Nuevo"} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {fields.map(f => (
              <Fl key={f.key} label={f.label}>
                {f.type === "select" ? (
                  <select
                    className={IC}
                    value={form[f.key] ?? ""}
                    onChange={e => setForm(x => ({ ...x, [f.key]: parseInputValue(f, e.target.value) }))}
                  >
                    <option value="">Seleccionar...</option>
                    {(f.options || []).map((opt) => (
                      <option key={`${f.key}-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    step={f.step}
                    className={IC}
                    value={form[f.key] || ""}
                    onChange={e => setForm(x => ({ ...x, [f.key]: parseInputValue(f, e.target.value) }))}
                  />
                )}
              </Fl>
            ))}
          </div>
          <FBtns onSave={() => { onSave({ ...form, id: editId || undefined }); setModal(false); }} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

function Maestros({ data, onUpdate }) {
  const mk = (col, cntKey) => ({
    onSave: (rec) => {
      const nextRec = { ...rec };
      if (col === "productos") nextRec.iva = ivaPct(nextRec.iva);
      if (col === "clientes") nextRec.vendedorId = hasValue(nextRec.vendedorId) ? +nextRec.vendedorId : "";
      if (rec.id) onUpdate(col, data[col].map(x => x.id === rec.id ? nextRec : x));
      else {
        const n = data.cnt[cntKey] + 1;
        onUpdate(col, [...data[col], { ...nextRec, id: n }]);
        onUpdate("cnt", { ...data.cnt, [cntKey]: n });
      }
    },
    onDelete: (id) => onUpdate(col, data[col].filter(x => x.id !== id)),
  });
  return (
    <div>
      <PageHdr title="Maestros" sub="Catalogos base del sistema" />
      <MaestroCRUD
        title="Clientes"
        items={data.clientes}
        fields={[
          { key: "nombre", label: "Nombre" },
          { key: "cuit", label: "CUIT" },
          {
            key: "vendedorId",
            label: "Vendedor",
            type: "select",
            valueType: "number",
            options: data.vendedores.map((v) => ({ value: v.id, label: v.nombre })),
            render: (value) => lookupNombre(data.vendedores, value),
          },
        ]}
        {...mk("clientes", "cli")}
      />
      <MaestroCRUD title="Proveedores" items={data.proveedores} fields={[{ key: "nombre", label: "Nombre" }, { key: "cuit", label: "CUIT" }]} {...mk("proveedores", "prov")} />
      <MaestroCRUD
        title="Productos"
        items={data.productos}
        fields={[
          { key: "nombre", label: "Nombre" },
          { key: "tipo", label: "Tipo" },
          { key: "costo", label: "Costo USD", type: "number", step: "0.01" },
          { key: "precio", label: "Precio USD", type: "number", step: "0.01" },
          {
            key: "iva",
            label: "IVA %",
            type: "select",
            valueType: "number",
            options: [
              { value: 10.5, label: "10.5%" },
              { value: 21, label: "21%" },
            ],
            render: (value) => `${fmt(ivaPct(value), 1)}%`,
          },
        ]}
        {...mk("productos", "prod")}
      />
      <MaestroCRUD title="Vendedores" items={data.vendedores} fields={[{ key: "nombre", label: "Nombre" }]} {...mk("vendedores", "vend")} />
    </div>
  );
}

// â”€â”€â”€ OCR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OCR({ data, onUpdate }) {
  const [docType, setDocType] = useState("factura");
  const [img, setImg] = useState(null);
  const [imgB64, setImgB64] = useState(null);
  const [fileMime, setFileMime] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();
  const onFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImg((file.type || "").startsWith("image/") ? dataUrl : null);
      setImgB64(dataUrl.split(",")[1]);
      setFileMime(file.type || "image/jpeg");
      setFileName(file.name || "");
      setExtracted(null);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };
  const prompts = {
    factura: `Analiza esta factura y devuelve SOLO JSON sin texto extra:\n{"fecha":"YYYY-MM-DD","proveedor":"nombre","producto":"descripcion","cantidad":0,"precioUnitario":0,"total":0,"observaciones":""}`,
    remito: `Analiza este remito y devuelve SOLO JSON:\n{"fecha":"YYYY-MM-DD","cliente":"nombre","producto":"descripcion","cantidad":0,"lote":"","observaciones":""}`,
    recibo: `Analiza este recibo y devuelve SOLO JSON:\n{"fecha":"YYYY-MM-DD","cliente":"nombre","monto":0,"moneda":"PESOS o DOLAR","medioPago":"EFECTIVO/TRANSFERENCIA/TARJETA","concepto":""}`,
    compra: `Analiza esta factura de compra y devuelve SOLO JSON:\n{"fecha":"YYYY-MM-DD","proveedor":"nombre","producto":"descripcion","cantidad":0,"precioUnitario":0,"moneda":"USD o PESOS","total":0}`,
  };
  const analyze = async () => {
    if (!imgB64) return;
    setLoading(true); setExtracted(null);
    try {
      const parsed = await callOcrApi({
        prompt: prompts[docType],
        mimeType: fileMime || "image/jpeg",
        base64: imgB64,
      });
      setExtracted(parsed);
    } catch (err) { alert(`Error OCR: ${err?.message || "verifica configuracion OCR del servidor."}`); }
    setLoading(false);
  };
  const saveExtracted = () => {
    if (!extracted) return;
    const match = (arr, val) => arr.find(x => val && x.nombre.toLowerCase().includes(val.toLowerCase()));
    if (docType === "remito") {
      const prod = match(data.productos, extracted.producto), n = data.cnt.rem + 1;
      onUpdate("remitos", [...data.remitos, { id: `R-${pad4(n)}`, opId: data.operaciones[0]?.id || "", fecha: extracted.fecha || today(), productoId: prod?.id || "", cantidad: +extracted.cantidad || 0, obs: extracted.observaciones || "", lote: extracted.lote || "" }]);
      onUpdate("cnt", { ...data.cnt, rem: n });
    } else if (docType === "recibo") {
      const cli = match(data.clientes, extracted.cliente), n = data.cnt.rec + 1;
      onUpdate("recibos", [...data.recibos, { id: `RC_${pad4(n)}`, fecha: extracted.fecha || today(), clienteId: cli?.id || "", facturaId: "", concepto: extracted.concepto || "", monto: +extracted.monto || 0, moneda: extracted.moneda || "PESOS", tc: 1400, medioPago: extracted.medioPago || "EFECTIVO" }]);
      onUpdate("cnt", { ...data.cnt, rec: n });
    } else if (docType === "compra") {
      const prov = match(data.proveedores, extracted.proveedor), prod = match(data.productos, extracted.producto), n = data.cnt.oc + 1;
      onUpdate("compras", [...data.compras, { id: `OC_${pad4(n)}`, fecha: extracted.fecha || today(), proveedorId: prov?.id || "", productoId: prod?.id || "", cantidad: +extracted.cantidad || 0, precio: +extracted.precioUnitario || 0, moneda: extracted.moneda || "USD", entregaEst: "", recepcion: "", cantRecibida: 0, pagado: 0, medioPago: "" }]);
      onUpdate("cnt", { ...data.cnt, oc: n });
    } else {
      const prod = match(data.productos, extracted.producto), n = data.cnt.fac + 1;
      const facId = `F_${pad4(n)}`;
      const opId = data.operaciones[0]?.id || "";
      const op = data.operaciones.find((o) => o.id === opId);
      onUpdate("facturas", [...data.facturas, {
        id: facId,
        facBaseId: facId,
        facLine: 1,
        fecha: extracted.fecha || today(),
        opId,
        productoId: prod?.id || "",
        cantidad: +extracted.cantidad || 0,
        precioUnit: +extracted.precioUnitario || 0,
        ivaPct: ivaPct(prod?.iva),
        fechaCobro: "",
        cobrado: 0,
        clienteId: op?.clienteId || null,
        vendedorId: op?.vendedorId || null,
      }]);
      onUpdate("cnt", { ...data.cnt, fac: n });
    }
    setSaved(true);
  };
  const docLabels = { factura: "Factura", remito: "Remito", recibo: "Recibo", compra: "Factura de Compra" };
  return (
    <div>
      <PageHdr title="Carga con OCR" sub="Subi una foto del documento y la IA extrae los datos" />
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">1. Tipo de documento</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(docLabels).map(([k, v]) => (
                <button key={k} onClick={() => { setDocType(k); setExtracted(null); setSaved(false); }} className={`py-2.5 rounded-xl text-sm font-semibold border ${docType === k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"}`}>{v}</button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">2. Archivo (imagen o PDF)</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400" onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />
              {img
                ? <img src={img} alt="doc" className="max-h-48 object-contain rounded-lg" />
                : fileMime === "application/pdf"
                  ? <><div className="text-4xl text-gray-300">pdf</div><p className="text-sm text-gray-400">{fileName || "PDF cargado"}</p></>
                  : <><div className="text-4xl text-gray-300">foto</div><p className="text-sm text-gray-400">Toca para subir</p></>}
            </div>
            {imgB64 && <button onClick={analyze} disabled={loading} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-sm font-bold">{loading ? "Analizando..." : "Analizar con IA"}</button>}
          </Card>
        </div>
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">3. Datos extraidos</p>
          {!extracted && !loading && <div className="text-center py-12 text-gray-300"><p className="text-sm">Subi un documento y analiza</p></div>}
          {loading && <div className="text-center py-12 text-gray-400 animate-pulse"><p>Analizando con IA...</p></div>}
          {extracted && (
            <div className="space-y-3">
              {Object.entries(extracted).map(([k, v]) => v != null && (
                <div key={k} className="flex gap-3 items-start">
                  <span className="text-xs font-bold text-gray-400 uppercase w-28 flex-shrink-0 pt-0.5">{k}</span>
                  <span className="text-sm text-gray-800 font-medium">{String(v)}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100">
                {!saved ? <button onClick={saveExtracted} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold">Confirmar y guardar</button>
                  : <div className="text-center py-3 bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-sm">Guardado exitosamente</div>}
                <button onClick={() => { setExtracted(null); setSaved(false); setImg(null); setImgB64(null); setFileMime(""); setFileName(""); }} className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-gray-600">Cargar otro</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// â”€â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Dashboard({ data }) {
  const { operaciones, facturas, remitos, recibos, compras, productos, clientes } = data;
  const apiBase = publicApiBase();
  const porCobrarUSD = facturas.reduce((s, f) => s + facSaldo(f, recibos, productos), 0);
  const cobradoUSD = recibos.reduce((s, r) => s + reciboUSD(r), 0);
  const opActivas = operaciones.filter(op => !opTracks(op, facturas, remitos, recibos, productos).done).length;
  const compPend = compras.reduce((s, c) => s + Math.max(0, num(c.cantidad) * num(c.precio) - num(c.pagado)), 0);
  const stockAlerts = productos.filter(p => stockProd(p.id, compras, remitos) <= 20).length;
  const ventasMes = facturas.filter(f => new Date(f.fecha).getMonth() === new Date().getMonth()).reduce((s, f) => s + num(f.cantidad) * num(f.precioUnit), 0);
  const pendientes = operaciones.map(op => ({ op, t: opTracks(op, facturas, remitos, recibos, productos) })).filter(({ t }) => !t.done && (t.pendFacturar > 0 || t.pendCobrar > 0.01));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Ejecutivo</h1>
        <p className="text-sm text-gray-400 mt-1">LDS AGRO â€” {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPI label="Por Cobrar" value={`USD ${fmt(porCobrarUSD)}`} sub="saldo de facturas" color="blue" icon="doc" />
        <KPI label="Total Cobrado" value={`USD ${fmt(cobradoUSD)}`} sub="en recibos" color="emerald" icon="pay" />
        <KPI label="Ventas del Mes" value={`USD ${fmt(ventasMes)}`} sub="sin IVA" color="violet" icon="chart" />
        <KPI label="Ops. Activas" value={opActivas} sub="sin completar" color="amber" icon="ops" />
        <KPI label="Compras Pend." value={`USD ${fmt(compPend)}`} sub="a pagar" color="amber" icon="cart" />
        <KPI label="Alertas Stock" value={stockAlerts} sub="productos bajos" color={stockAlerts > 0 ? "red" : "emerald"} icon="box" />
      </div>
      <Card className="mb-4">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-700 text-sm">Excel / Power BI en tiempo real</h2>
            <p className="text-xs text-gray-400 mt-1">La app sincroniza en DB y actualiza CSV vivos para consumir desde Excel o Power BI.</p>
          </div>
          <a
            href={`${apiBase}/api/export/operaciones.csv`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            Abrir CSV de operaciones
          </a>
        </div>
        <div className="px-5 py-4 grid md:grid-cols-2 grid-cols-1 gap-3 text-xs">
          {EXPORT_TABLES.map((table) => (
            <div key={table} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between gap-2">
              <span className="font-semibold text-gray-600">{table}</span>
              <a
                href={`${apiBase}/live/${table}.csv`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                /live/{table}.csv
              </a>
            </div>
          ))}
        </div>
      </Card>
      {pendientes.length > 0 && (
        <Card className="mb-4">
          <div className="px-5 pt-4 pb-2 border-b border-gray-50 flex items-center gap-2">
            <h2 className="font-bold text-gray-700 text-sm">Operaciones que requieren accion</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendientes.length}</span>
          </div>
          <table className="w-full text-sm">
            <THead cols={["Operacion","Cliente","Producto","Pend. Facturar","Pend. Cobrar","Progreso"]} />
            <tbody>
              {pendientes.map(({ op, t }) => (
                <TR key={op.id} highlight>
                  <TD mono><span className="text-emerald-700 font-bold">{op.id}</span></TD>
                  <TD bold>{lookupNombre(clientes, op.clienteId)}</TD>
                  <TD>{lookupNombre(productos, op.productoId)}</TD>
                  <td className="px-4 py-2.5">{t.pendFacturar > 0 ? <span className="text-violet-600 font-semibold text-sm">{t.pendFacturar} u. sin facturar</span> : <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-2.5">{t.pendCobrar > 0.01 ? <span className="text-amber-600 font-semibold text-sm">USD {fmt(t.pendCobrar)}</span> : <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-2.5"><TrackPanel tracks={t} /></td>
                </TR>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="px-5 pt-4 pb-2 border-b border-gray-50"><h2 className="font-bold text-gray-700 text-sm">Facturas pendientes</h2></div>
          <table className="w-full text-sm">
            <THead cols={["Factura","Cliente","Total","Saldo","Estado"]} />
            <tbody>
              {facturas.filter(f => facStatus(f, recibos, productos) !== "Pagado").slice(0, 6).map(f => {
                const op = operaciones.find(o => o.id === f.opId);
                return (
                  <TR key={f.id}>
                    <TD mono gray>{f.id}</TD>
                    <TD bold>{op ? lookupNombre(clientes, op.clienteId) : "-"}</TD>
                    <TD right>USD {fmt(facTotal(f, productos))}</TD>
                    <TD right bold>USD {fmt(facSaldo(f, recibos, productos))}</TD>
                    <td className="px-4 py-2.5"><Bdg s={facStatus(f, recibos, productos)} /></td>
                  </TR>
                );
              })}
              {!facturas.filter(f => facStatus(f, recibos, productos) !== "Pagado").length && <EmptyRow cols={5} />}
            </tbody>
          </table>
        </Card>
        <Card>
          <div className="px-5 pt-4 pb-2 border-b border-gray-50"><h2 className="font-bold text-gray-700 text-sm">Estado de Stock</h2></div>
          <table className="w-full text-sm">
            <THead cols={["Producto","Stock","Estado"]} />
            <tbody>
              {productos.map(p => {
                const stock = stockProd(p.id, compras, remitos);
                return <TR key={p.id}><TD bold>{p.nombre}</TD><TD right bold>{stock}</TD><td className="px-4 py-2.5"><Bdg s={stockStatus(stock)} /></td></TR>;
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// â”€â”€â”€ APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "operaciones", label: "Operaciones" },
  { id: "facturacion", label: "Facturacion" },
  { id: "remitos", label: "Remitos" },
  { id: "recibos", label: "Recibos" },
  { id: "compras", label: "Compras" },
  { id: "stock", label: "Stock" },
  { id: "costos", label: "Costos" },
  { id: "ocr", label: "Carga OCR" },
  { id: "maestros", label: "Maestros" },
];

function NavIcon({ id, className = "w-5 h-5" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (id) {
    case "dashboard":
      return <svg {...props}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></svg>;
    case "operaciones":
      return <svg {...props}><path d="M13 2L4 14h7l-1 8 10-12h-7z" /></svg>;
    case "facturacion":
      return <svg {...props}><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4M10 12h6M10 16h6" /></svg>;
    case "remitos":
      return <svg {...props}><path d="M3 7h11v9H3zM14 10h3l3 3v3h-6z" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></svg>;
    case "recibos":
      return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h10M7 14h6" /></svg>;
    case "compras":
      return <svg {...props}><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /><path d="M3 5h2l2.2 10h10.3l2-7H7.5" /></svg>;
    case "stock":
      return <svg {...props}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" /></svg>;
    case "costos":
      return <svg {...props}><path d="M4 19V5M9 19v-8M14 19v-5M19 19V9" /></svg>;
    case "ocr":
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /><path d="M8.5 11h5M11 8.5v5" /></svg>;
    case "maestros":
      return <svg {...props}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1 1 0 00.2 1.1l.1.1a1 1 0 010 1.4l-1 1a1 1 0 01-1.4 0l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a1 1 0 01-1 1h-1.5a1 1 0 01-1-1v-.2a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a1 1 0 01-1.4 0l-1-1a1 1 0 010-1.4l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a1 1 0 01-1-1v-1.5a1 1 0 011-1h.2a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a1 1 0 010-1.4l1-1a1 1 0 011.4 0l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4a1 1 0 011-1h1.5a1 1 0 011 1v.2a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a1 1 0 011.4 0l1 1a1 1 0 010 1.4l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6h.2a1 1 0 011 1V13a1 1 0 01-1 1h-.2a1 1 0 00-.9.6z" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

const LOGO_CANDIDATES = [
  "/logo.jpeg",
  "/logo.jpg",
  "/logo.png",
  "/logo.webp",
  "/logo.svg",
  "logo.jpeg",
  "logo.jpg",
  "logo.png",
  "logo.webp",
  "logo.svg",
  "/logo.fpeg",
  "logo.fpeg",
];
const STORAGE_KEY = "erp-lds-v2";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const EXPORT_TABLES = ["operaciones", "facturas", "remitos", "recibos", "compras", "clientes", "proveedores", "productos", "vendedores", "costos"];

const buildApiBases = () => {
  const bases = [];
  if (API_BASE) bases.push(API_BASE);

  if (typeof window === "undefined") {
    bases.push("http://localhost:4000");
  } else {
    if (window.location.protocol === "file:") {
      bases.push("http://localhost:4000");
    } else {
      bases.push("");
      bases.push(`${window.location.protocol}//${window.location.hostname || "localhost"}:4000`);
    }
  }

  return Array.from(new Set(bases.filter(Boolean)));
};

const apiUrl = (path, base = API_BASE) => `${base}${path}`;

async function fetchApi(path, options = {}) {
  const bases = buildApiBases();
  let lastErr = null;
  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    try {
      const res = await fetch(apiUrl(path, base), options);
      if (res.status === 404 && i < bases.length - 1) continue;
      return res;
    } catch (err) {
      lastErr = err;
      if (i === bases.length - 1) throw err;
    }
  }
  throw lastErr || new Error("No se pudo conectar con la API.");
}

const publicApiBase = () => {
  if (API_BASE) return API_BASE;
  if (typeof window === "undefined") return "http://localhost:4000";
  if (window.location.protocol === "file:") return "http://localhost:4000";
  return `${window.location.protocol}//${window.location.hostname || "localhost"}:4000`;
};

const hasBridgeStorage = () =>
  typeof window !== "undefined" &&
  window.storage &&
  typeof window.storage.get === "function" &&
  typeof window.storage.set === "function";

async function loadPersistedData() {
  if (typeof window === "undefined") return null;
  try {
    const r = await fetchApi("/api/state");
    if (r.ok) {
      const payload = await r.json();
      if (payload?.data && typeof payload.data === "object") return payload.data;
    }
  } catch {
    void 0;
  }

  try {
    if (hasBridgeStorage()) {
      const r = await window.storage.get(STORAGE_KEY);
      return r?.value ? JSON.parse(r.value) : null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function persistData(data) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(data);
  try {
    const r = await fetchApi("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    if (r.ok) return;
  } catch {
    void 0;
  }

  try {
    if (hasBridgeStorage()) {
      await window.storage.set(STORAGE_KEY, payload);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    return;
  }
}

const maxIdByRegex = (rows, regex) => (rows || []).reduce((max, row) => {
  const m = String(row?.id || "").match(regex);
  if (!m) return max;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(max, n) : max;
}, 0);

function normalizeData(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const productos = (Array.isArray(src.productos) ? src.productos : SEED.productos)
    .map((p) => ({ ...p, iva: ivaPct(p?.iva) }));
  const operaciones = (Array.isArray(src.operaciones) ? src.operaciones : SEED.operaciones)
    .map((op) => {
      const base = op.opBaseId || opBaseId(op.id);
      return {
        ...op,
        opBaseId: base,
        opLine: num(op.opLine) > 0 ? num(op.opLine) : parseLineNo(op.id),
      };
    });
  const clientes = (Array.isArray(src.clientes) ? src.clientes : SEED.clientes)
    .map((c) => {
      if (hasValue(c.vendedorId)) return { ...c, vendedorId: +c.vendedorId };
      const op = operaciones.find((o) => +o.clienteId === +c.id && hasValue(o.vendedorId));
      return { ...c, vendedorId: op?.vendedorId || "" };
    });
  const facturas = (Array.isArray(src.facturas) ? src.facturas : SEED.facturas)
    .map((f) => {
      const op = operaciones.find((o) => o.id === f.opId);
      return {
        ...f,
        facBaseId: f.facBaseId || facturaBaseId(f),
        facLine: num(f.facLine) > 0 ? num(f.facLine) : facturaLineNo(f),
        ivaPct: facturaIvaPct(f, productos),
        clienteId: hasValue(f.clienteId) ? +f.clienteId : (op?.clienteId || null),
        vendedorId: hasValue(f.vendedorId) ? +f.vendedorId : (op?.vendedorId || null),
      };
    });
  const remitos = Array.isArray(src.remitos) ? src.remitos : SEED.remitos;
  const recibos = (Array.isArray(src.recibos) ? src.recibos : SEED.recibos)
    .map((r) => ({ ...r, clienteId: hasValue(r.clienteId) ? +r.clienteId : null }));
  const compras = Array.isArray(src.compras) ? src.compras : SEED.compras;
  const proveedores = Array.isArray(src.proveedores) ? src.proveedores : SEED.proveedores;
  const vendedores = Array.isArray(src.vendedores) ? src.vendedores : SEED.vendedores;
  const costos = Array.isArray(src.costos) ? src.costos : SEED.costos;

  const computedCnt = {
    op: maxIdByRegex(operaciones, /^OP_(\d+)/),
    fac: maxIdByRegex(facturas, /^F_(\d+)/),
    rem: maxIdByRegex(remitos, /^R-(\d+)/),
    rec: maxIdByRegex(recibos, /^RC_(\d+)/),
    oc: maxIdByRegex(compras, /^OC_(\d+)/),
    cos: maxIdByRegex(costos, /^C-(\d+)/),
    cli: (clientes || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
    prov: (proveedores || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
    prod: (productos || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
    vend: (vendedores || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
  };
  const cntSrc = src.cnt && typeof src.cnt === "object" ? src.cnt : {};
  const cnt = Object.fromEntries(
    Object.entries(computedCnt).map(([k, v]) => [k, Math.max(v, num(cntSrc[k]))]),
  );

  return {
    ...SEED,
    ...src,
    vendedores,
    productos,
    clientes,
    proveedores,
    operaciones,
    facturas,
    remitos,
    recibos,
    compras,
    costos,
    cnt,
  };
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(() => normalizeData(SEED));
  const [loaded, setLoaded] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const [navTarget, setNavTarget] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await loadPersistedData();
        if (raw) setData(normalizeData(raw));
      } catch {
        setData(normalizeData(SEED));
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    persistData(data);
  }, [data, loaded]);

  const onUpdate = (key, val) => setData(d => normalizeData({ ...d, [key]: val }));
  const onNavigate = (module, id) => {
    if (!module || !id) return;
    setPage(module);
    setNavTarget({ module, id: String(id), ts: Date.now() });
  };
  const logoSrc = LOGO_CANDIDATES[logoIndex];
  const hasLogo = Boolean(logoSrc);

  if (!loaded) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center"><div className="text-2xl mb-4 font-extrabold text-emerald-700 tracking-wide">LDS</div><p className="text-gray-400 font-medium">Cargando LDS AGRO ERP...</p></div>
    </div>
  );

  const modules = { dashboard: Dashboard, operaciones: Operaciones, facturacion: Facturacion, remitos: Remitos, recibos: Recibos, compras: Compras, stock: Stock, costos: Costos, ocr: OCR, maestros: Maestros };
  const Page = modules[page];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <aside className="group w-[72px] hover:w-56 bg-gradient-to-b from-emerald-950 to-emerald-900 flex flex-col flex-shrink-0 shadow-2xl transition-all duration-300">
        <div className="px-3 py-4 border-b border-emerald-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl border border-emerald-800/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {hasLogo ? (
                <img
                  src={logoSrc}
                  alt="Logo LDS Agro"
                  className="w-full h-full object-contain"
                  onError={() => setLogoIndex((i) => i + 1)}
                />
              ) : (
                <span className="text-emerald-200 font-black text-sm tracking-wide">LDS</span>
              )}
            </div>
            <div className="min-w-0 overflow-hidden max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 transition-all duration-300">
              <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">LDS AGRO</p>
              <p className="text-emerald-400 text-xs whitespace-nowrap">Sistema ERP v2</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setNavTarget(null); }}
              className={`w-full flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 px-2 group-hover:px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${page === item.id ? "bg-emerald-400 text-emerald-950 font-bold" : "text-emerald-200 hover:bg-emerald-800/60 hover:text-white"}`}>
              <span className="flex-shrink-0"><NavIcon id={item.id} className="w-5 h-5" /></span>
              <span className="min-w-0 overflow-hidden max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-emerald-800/50">
          <p className="text-emerald-500 text-xs text-center whitespace-nowrap overflow-hidden max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 transition-all duration-300">
            v2.0 - Autoguardado activo
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="w-full p-6">
          <Page data={data} onUpdate={onUpdate} onNavigate={onNavigate} navTarget={navTarget} />
        </div>
      </main>
    </div>
  );
}

