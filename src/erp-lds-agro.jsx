import { Fragment, useState, useEffect, useLayoutEffect, useRef, createContext, useContext } from "react";
import { descargarFacturaPDF, descargarRemitoPDF, descargarReciboPDF, descargarEstadoCuentaPDF } from "./pdf-comprobantes.js";

const RoleContext = createContext("admin");
const useCurrentRole = () => useContext(RoleContext);
const useCanDelete = () => useCurrentRole() === "admin";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  DollarSign,
  FileClock,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  ReceiptText,
  ScanText,
  Search,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  Truck,
  UserCircle2,
  UserCog,
  UserPlus,
  Users,
  History,
  ShieldCheck,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  FileDown,
  BookMinus,
  BookPlus,
  ListOrdered,
  Menu,
  X,
  Banknote,
} from "lucide-react";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = {
  vendedores: [
    { id: 1, nombre: "Ariel Galindo" },
    { id: 2, nombre: "Lucas Dalzotto" },
    { id: 3, nombre: "Matias" },
    { id: 4, nombre: "Guille DelPupo" },
  ],
  productos: [
    { id: 1, nombre: "Glifosato liquido", tipo: "Herbicida", unidadMedida: "LITROS", costo: 3.65, precio: 4.2, iva: 10.5 },
    { id: 2, nombre: "Imazetapyr", tipo: "Herbicida", unidadMedida: "LITROS", costo: 4.35, precio: 5, iva: 21 },
    { id: 3, nombre: "Metribuzin", tipo: "Herbicida", unidadMedida: "KGS", costo: 13.91, precio: 16, iva: 21 },
    { id: 4, nombre: "Diflufenicam", tipo: "Herbicida", unidadMedida: "KGS", costo: 20.87, precio: 24, iva: 21 },
    { id: 5, nombre: "2-4D", tipo: "Herbicida", unidadMedida: "LITROS", costo: 3.0, precio: 5, iva: 10.5 },
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
    { id: "F_0001", numeroFactura: "0001-00000001", fecha: "2026-04-21", opId: "OP_0001", productoId: 5, cantidad: 150, precioUnit: 5, ivaPct: 10.5, fechaCobro: "2026-08-29", cobrado: 0, clienteId: 1, vendedorId: 2 },
    { id: "F_0002", numeroFactura: "0001-00000002", fecha: "2026-04-21", opId: "OP_0002", productoId: 5, cantidad: 100, precioUnit: 5, ivaPct: 10.5, fechaCobro: "", cobrado: 0, clienteId: 2, vendedorId: 2 },
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
  remitosCompra: [],
  facturasCompra: [],
  recibosCompra: [],
  costos: [],
  notasCredito: [],
  notasDebito: [],
  cotizaciones: [],
  movimientosStock: [],
  cheques: [],
  usuarios: [
    { id: 1, nombre: "Administrador", usuario: "admin", password: "admin123", rol: "admin", activo: true },
    { id: 2, nombre: "Vendedor", usuario: "vendedor", password: "vendedor123", rol: "vendedor", activo: true },
  ],
  sesion: { usuarioId: 1 },
  auditoria: [],
  cnt: { op: 2, fac: 2, rem: 2, rec: 2, oc: 2, rmp: 0, fcp: 0, rcp: 0, cos: 0, nc: 0, nd: 0, cot: 0, chk: 0, cli: 2, prov: 2, prod: 5, vend: 4 },
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (n, d = 2) => n == null ? "-" : Number(n).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtD = (d) => d ? d.split("-").reverse().join("/") : "-";
const fmtDT = (dt) => {
  if (!dt) return "-";
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("es-AR");
};
const today = () => new Date().toISOString().split("T")[0];
const pad4 = (n) => String(n).padStart(4, "0");
const num = (v) => isNaN(+v) ? 0 : +v;
const lookupNombre = (arr, id) => arr?.find(x => x.id === +id)?.nombre || "-";
const hasValue = (v) => v !== undefined && v !== null && String(v) !== "";
const PRODUCT_UNIT_OPTIONS = [
  { value: "UNIDADES", label: "Unidades (u.)", short: "u." },
  { value: "LITROS", label: "Litros (L)", short: "L" },
  { value: "KGS", label: "Kgs (kg)", short: "kg" },
];
const normalizeUnidadMedida = (v) => {
  const raw = String(v || "").trim().toUpperCase();
  if (raw === "L" || raw === "LITRO" || raw === "LITROS") return "LITROS";
  if (raw === "KG" || raw === "KILO" || raw === "KILOS" || raw === "KGS") return "KGS";
  return "UNIDADES";
};
const unidadMedidaShort = (unidad) => PRODUCT_UNIT_OPTIONS.find((u) => u.value === normalizeUnidadMedida(unidad))?.short || "u.";

// ─── Anulación lógica (Fase 0) ───────────────────────────────────────────────
// Cualquier registro operativo (factura, recibo, remito, compra, nota, etc.) puede
// estar anulado. Los anulados se conservan para trazabilidad pero no impactan en
// cálculos (stock, saldos, CMV, cuenta corriente).
const isActive = (r) => !r?.anulado;
const filterActive = (arr) => (arr || []).filter(isActive);
const ensureAnulacionFields = (rec) => ({
  anulado: !!rec?.anulado,
  anuladoEl: rec?.anuladoEl || null,
  anuladoPor: rec?.anuladoPor || null,
  motivoAnulacion: rec?.motivoAnulacion || null,
});

// ─── Cotización USD/ARS (Fase 1) ─────────────────────────────────────────────
// Fuente principal: Banco Nación (vía DolarApi). Cada operación que use TC fija
// `tc`, `tcFuente` y `tcFecha` para conservar el TC histórico aunque la
// cotización vigente cambie después.
const TC_FALLBACK = 1400;

// Última cotización activa (cualquier fuente)
const getCotizacionActual = (cotizaciones) => {
  const activas = filterActive(cotizaciones || []);
  if (!activas.length) return null;
  return activas[activas.length - 1];
};

// Cotización vigente para una fecha dada (la más reciente con fecha <= fechaRef)
const getCotizacionParaFecha = (cotizaciones, fechaRef) => {
  const activas = filterActive(cotizaciones || []);
  if (!activas.length) return null;
  const ref = String(fechaRef || "").slice(0, 10);
  if (!ref) return activas[activas.length - 1];
  let candidato = null;
  for (const c of activas) {
    const cf = String(c.fecha || "").slice(0, 10);
    if (cf <= ref && (!candidato || cf >= String(candidato.fecha || "").slice(0, 10))) candidato = c;
  }
  return candidato || activas[0];
};

const getTCActual = (cotizaciones) => num(getCotizacionActual(cotizaciones)?.venta) || TC_FALLBACK;

// Construye los campos de TC a guardar en una operación nueva
const construirTC = (cotizaciones, fecha) => {
  const cot = getCotizacionParaFecha(cotizaciones, fecha);
  if (!cot) return { tc: TC_FALLBACK, tcFuente: "fallback", tcFecha: null, tcId: null };
  return {
    tc: num(cot.venta),
    tcFuente: cot.fuente || "manual",
    tcFecha: cot.fecha,
    tcId: cot.id || null,
  };
};
const ivaPct = (v) => {
  const n = num(v);
  return n > 0 ? n : 21;
};
const productoById = (productos, id) => productos?.find((p) => +p.id === +id);
const productoUnidad = (productos, productoId) => unidadMedidaShort(productoById(productos, productoId)?.unidadMedida);
const productoIvaPct = (productos, productoId) => ivaPct(productoById(productos, productoId)?.iva);
const opIvaPct = (op, productos) => productoIvaPct(productos, op?.productoId);
const ivaAmount = (base, pctIva) => num(base) * (ivaPct(pctIva) / 100);
const totalWithIva = (base, pctIva) => num(base) + ivaAmount(base, pctIva);
const opBaseId = (id = "") => String(id).split("-")[0];
const compraBaseIdFromId = (id = "") => String(id).split("-")[0];
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
const compraBaseId = (c) => c?.ocBaseId || compraBaseIdFromId(c?.id || "");
const compraLineNo = (c) => num(c?.ocLine) > 0 ? num(c.ocLine) : parseLineNo(c?.id || "");
const compraIvaPct = (c, productos = []) => hasValue(c?.ivaPct) ? ivaPct(c.ivaPct) : productoIvaPct(productos, c?.productoId);
const buildCompraDocRefSets = (compras = []) => {
  const ids = new Set();
  const bases = new Set();
  for (const c of (compras || [])) {
    const id = String(c?.id || "");
    const base = String(c?.ocBaseId || compraBaseId(c) || "");
    if (id) ids.add(id);
    if (base) bases.add(base);
  }
  return { ids, bases };
};
const isCompraDocLinkedToRefs = (row, refSets, opts = {}) => {
  if (!row || !refSets) return false;
  const { baseOnlyIfNoId = false } = opts;
  const rid = String(row?.compraId || "");
  const rbase = String(row?.compraBaseId || "");
  if (rid && refSets.ids.has(rid)) return true;
  if (rbase && refSets.bases.has(rbase) && (!baseOnlyIfNoId || !rid)) return true;
  for (const ap of normalizeReciboCompraAplicaciones(row?.facturasCompraAplicadas)) {
    const aid = String(ap?.compraId || "");
    const abase = String(ap?.compraBaseId || "");
    if (aid && refSets.ids.has(aid)) return true;
    if (abase && refSets.bases.has(abase)) return true;
  }
  return false;
};
const facturaCompraIvaPct = (f, productos = []) => hasValue(f?.ivaPct) ? ivaPct(f.ivaPct) : productoIvaPct(productos, f?.productoId);
const facCompraSubtotal = (f) => hasValue(f?.subtotal) ? num(f.subtotal) : (num(f?.cantidad) * num(f?.precioUnit));
const facCompraIvaMonto = (f, productos = []) => hasValue(f?.ivaMonto) ? num(f.ivaMonto) : ivaAmount(facCompraSubtotal(f), facturaCompraIvaPct(f, productos));
const facCompraTotal = (f, productos = []) => hasValue(f?.totalConIva) ? num(f.totalConIva) : (facCompraSubtotal(f) + facCompraIvaMonto(f, productos));
const facCompraSubtotalUSD = (f) => moneyToUSD(facCompraSubtotal(f), f?.moneda, f?.tc);
const facCompraIvaMontoUSD = (f, productos = []) => moneyToUSD(facCompraIvaMonto(f, productos), f?.moneda, f?.tc);
const facCompraTotalUSD = (f, productos = []) => {
  return moneyToUSD(facCompraTotal(f, productos), f?.moneda, f?.tc);
};
const reciboCompraUSD = (r) => moneyToUSD(r?.monto, r?.moneda, r?.tc);

const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const pct = (a, b) => b > 0 ? clamp(Math.round((a / b) * 100), 0, 100) : 0;
const moneyToUSD = (monto, moneda, tc, fallbackTc = 1) => {
  const m = String(moneda || "").toUpperCase();
  if (m === "DOLAR" || m === "USD") return num(monto);
  return num(monto) / (num(tc) || num(fallbackTc) || 1);
};
const usdToMoney = (usd, moneda, tc, fallbackTc = 1) => {
  const m = String(moneda || "").toUpperCase();
  if (m === "DOLAR" || m === "USD") return num(usd);
  return num(usd) * (num(tc) || num(fallbackTc) || 1);
};
const roundMoney = (value, decimals = 6) => {
  const factor = 10 ** decimals;
  return Math.round(num(value) * factor) / factor;
};
const normalizeReciboAplicaciones = (aplicaciones = []) => {
  const bag = new Map();
  for (const raw of (Array.isArray(aplicaciones) ? aplicaciones : [])) {
    const facturaId = String(raw?.facturaId || "").trim();
    if (!facturaId) continue;
    const montoUSD = num(raw?.montoUSD);
    if (montoUSD <= 0) continue;
    bag.set(facturaId, roundMoney(num(bag.get(facturaId)) + montoUSD));
  }
  return Array.from(bag.entries()).map(([facturaId, montoUSD]) => ({ facturaId, montoUSD }));
};
const reciboTieneAplicaciones = (recibo) => normalizeReciboAplicaciones(recibo?.facturasAplicadas).length > 0;
const reciboAplicadoUSDEnFactura = (recibo, facturaId) =>
  normalizeReciboAplicaciones(recibo?.facturasAplicadas)
    .filter((x) => String(x.facturaId) === String(facturaId))
    .reduce((s, x) => s + num(x.montoUSD), 0);
const normalizeReciboCompraAplicaciones = (aplicaciones = []) => {
  const bag = new Map();
  for (const raw of (Array.isArray(aplicaciones) ? aplicaciones : [])) {
    const facturaCompraId = String(raw?.facturaCompraId || raw?.facturaId || "").trim();
    if (!facturaCompraId) continue;
    const montoUSD = num(raw?.montoUSD);
    if (montoUSD <= 0) continue;
    const prev = bag.get(facturaCompraId) || {
      facturaCompraId,
      compraId: raw?.compraId ? String(raw.compraId) : "",
      compraBaseId: raw?.compraBaseId ? String(raw.compraBaseId) : "",
      montoUSD: 0,
    };
    prev.montoUSD = roundMoney(num(prev.montoUSD) + montoUSD);
    if (!prev.compraId && raw?.compraId) prev.compraId = String(raw.compraId);
    if (!prev.compraBaseId && raw?.compraBaseId) prev.compraBaseId = String(raw.compraBaseId);
    bag.set(facturaCompraId, prev);
  }
  return Array.from(bag.values());
};
const reciboCompraTieneAplicaciones = (recibo) => normalizeReciboCompraAplicaciones(recibo?.facturasCompraAplicadas).length > 0;
const reciboCompraAplicadoUSDEnFactura = (recibo, facturaCompraId) =>
  normalizeReciboCompraAplicaciones(recibo?.facturasCompraAplicadas)
    .filter((x) => String(x.facturaCompraId) === String(facturaCompraId))
    .reduce((s, x) => s + num(x.montoUSD), 0);
const buildPagosByFacturaCompra = (recibosCompra = []) => {
  const map = new Map();
  for (const r of filterActive(recibosCompra)) {
    const apps = normalizeReciboCompraAplicaciones(r?.facturasCompraAplicadas);
    if (apps.length) {
      for (const ap of apps) {
        const key = String(ap.facturaCompraId || "");
        if (!key) continue;
        map.set(key, num(map.get(key)) + num(ap.montoUSD));
      }
      continue;
    }
    const key = String(r?.facturaCompraId || "");
    if (!key) continue;
    map.set(key, num(map.get(key)) + reciboCompraUSD(r));
  }
  return map;
};
const reciboFacturaRefs = (recibo) => {
  const refs = new Set();
  const rid = String(recibo?.facturaId || "").trim();
  const rbase = String(recibo?.facturaBaseId || "").trim();
  if (rid) refs.add(rid);
  if (rbase) refs.add(rbase);
  for (const ap of normalizeReciboAplicaciones(recibo?.facturasAplicadas)) {
    if (ap.facturaId) refs.add(String(ap.facturaId));
  }
  return refs;
};
const reciboAfectaFacturas = (recibo, facturaIdSet, facturaBaseSet) => {
  for (const ref of reciboFacturaRefs(recibo)) {
    if (facturaIdSet.has(ref) || facturaBaseSet.has(ref)) return true;
  }
  return false;
};
const CHEQUE_MEDIOS = ["CHEQUE", "CHEQUE_PROPIO", "CHEQUE_TERCERO"];
const CHEQUE_ESTADOS = ["en_cartera", "depositado", "cobrado", "entregado_proveedor", "rechazado", "anulado"];
const MEDIOS_PAGO_OPTIONS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "CHEQUE_PROPIO", label: "Cheque propio" },
  { value: "CHEQUE_TERCERO", label: "Cheque de terceros" },
  { value: "SALDO_A_FAVOR", label: "Saldo a favor proveedor" },
];
const medioPagoLabel = (value) =>
  MEDIOS_PAGO_OPTIONS.find((x) => x.value === String(value || "").toUpperCase())?.label
  || String(value || "").replaceAll("_", " ")
  || "-";
const monedaLabel = (value) => {
  const m = String(value || "").toUpperCase();
  return (m === "USD" || m === "DOLAR") ? "USD" : "ARS";
};
const isChequeMedio = (medioPago) => CHEQUE_MEDIOS.includes(String(medioPago || "").toUpperCase());
const chequeTipoFromMedio = (medioPago) => String(medioPago || "").toUpperCase() === "CHEQUE_PROPIO" ? "propio" : "terceros";
const chequeEstadoLabel = (estado) => ({
  en_cartera: "En cartera",
  depositado: "Depositado",
  cobrado: "Cobrado",
  entregado_proveedor: "Entregado a proveedor",
  rechazado: "Rechazado",
  anulado: "Anulado",
}[String(estado || "")] || "En cartera");
const addDaysIso = (fechaIso, days) => {
  const base = String(fechaIso || "").slice(0, 10);
  if (!base) return "";
  const d = new Date(`${base}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + num(days));
  return d.toISOString().slice(0, 10);
};
const calcFechaVencCheque = ({ fechaEmision, plazoDias, fechaVencimiento }) => {
  const exacta = String(fechaVencimiento || "").slice(0, 10);
  if (exacta) return exacta;
  const plazo = num(plazoDias);
  return addDaysIso(fechaEmision, Number.isFinite(plazo) ? plazo : 0);
};
const calcChequeCashflow = (cheques = [], horizonDays = 30) => {
  const ref = new Date(`${today()}T00:00:00`);
  const end = new Date(ref);
  end.setDate(end.getDate() + horizonDays);
  const inStates = new Set(["en_cartera", "depositado"]);
  const outStates = new Set(["entregado_proveedor"]);
  let ingresos = 0;
  let salidas = 0;
  let ingresosCount = 0;
  let salidasCount = 0;
  for (const ch of (cheques || [])) {
    if (ch?.anulado) continue;
    const fv = String(ch?.fechaVencimiento || "").slice(0, 10);
    if (!fv) continue;
    const d = new Date(`${fv}T00:00:00`);
    if (Number.isNaN(d.getTime())) continue;
    if (d < ref || d > end) continue;
    const usd = moneyToUSD(ch?.importe, ch?.moneda, ch?.tc);
    const est = String(ch?.estado || "en_cartera");
    if (String(ch?.tipo || "") === "terceros" && inStates.has(est)) {
      ingresos += usd;
      ingresosCount += 1;
    }
    if (String(ch?.tipo || "") === "propio" && outStates.has(est)) {
      salidas += usd;
      salidasCount += 1;
    }
  }
  return { ingresos, salidas, neto: ingresos - salidas, ingresosCount, salidasCount };
};
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
const formatLongDateAr = (value = new Date()) => {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(value);
  } catch {
    return new Date(value).toLocaleDateString("es-AR");
  }
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
const facturaLinesByRef = (facturaRef, facturas = []) => {
  const ref = String(facturaRef || "");
  if (!ref) return [];
  const activas = filterActive(facturas);
  const byId = activas.find((f) => String(f.id) === ref);
  const baseId = byId ? facturaBaseId(byId) : ref;
  const lines = activas.filter((f) => facturaBaseId(f) === baseId);
  if (lines.length) return lines;
  return byId ? [byId] : [];
};

const facturaTcHistorico = (factura, cotizaciones = []) => {
  const tcStored = num(
    factura?.tcFactura
    ?? factura?.tc
    ?? factura?.tipoCambio
    ?? factura?.tcOriginal
    ?? 0,
  );
  if (tcStored > 0) return tcStored;
  const cot = getCotizacionParaFecha(cotizaciones, factura?.fecha);
  const tcCot = num(cot?.venta);
  return tcCot > 0 ? tcCot : TC_FALLBACK;
};

const distribuirMontoEnFacturas = ({ facturaRef = "", aplicaciones = [], montoUSD = 0, facturas = [], recibos = [], productos = [] } = {}) => {
  const appsNormalizadas = normalizeReciboAplicaciones(aplicaciones)
    .map((ap) => ({ facturaId: String(ap.facturaId || ""), montoUSD: roundMoney(num(ap.montoUSD), 6) }))
    .filter((ap) => ap.facturaId && ap.montoUSD > 0);
  if (appsNormalizadas.length) return appsNormalizadas;

  const ref = String(facturaRef || "").trim();
  if (!ref) return [];
  const lines = facturaLinesByRef(ref, facturas);
  if (!lines.length) return [];

  const saldos = lines
    .map((f) => ({
      facturaId: String(f.id),
      saldoUSD: Math.max(0, facSaldo(f, recibos, productos, facturas)),
    }))
    .filter((x) => x.saldoUSD > 0.000001);
  if (!saldos.length) return [];

  const totalSaldo = saldos.reduce((s, x) => s + x.saldoUSD, 0);
  if (totalSaldo <= 0.000001) return [];
  const montoPedido = Math.max(0, num(montoUSD));
  const montoADistribuir = Math.min(montoPedido > 0 ? montoPedido : totalSaldo, totalSaldo);
  if (montoADistribuir <= 0.000001) return [];

  let restante = montoADistribuir;
  return saldos.map((x, idx) => {
    const esUltimo = idx === saldos.length - 1;
    const proporcional = esUltimo ? restante : (montoADistribuir * x.saldoUSD) / totalSaldo;
    const montoLinea = Math.max(0, Math.min(x.saldoUSD, roundMoney(proporcional, 6), restante));
    restante = Math.max(0, restante - montoLinea);
    return { facturaId: x.facturaId, montoUSD: roundMoney(montoLinea, 6) };
  }).filter((x) => x.montoUSD > 0.000001);
};

const sugerirDifCambioCobro = ({
  facturaRef = "",
  aplicaciones = [],
  montoUSD = 0,
  moneda = "USD",
  tcCobro = 1,
  facturas = [],
  recibos = [],
  productos = [],
  cotizaciones = [],
} = {}) => {
  const mon = String(moneda || "").toUpperCase();
  if (mon !== "PESOS" && mon !== "ARS") {
    return { estado: "sin_diferencia", motivo: "moneda_no_pesos" };
  }
  const tcPago = num(tcCobro);
  if (tcPago <= 0) return { estado: "sin_diferencia", motivo: "tc_invalido" };

  const dist = distribuirMontoEnFacturas({
    facturaRef,
    aplicaciones,
    montoUSD,
    facturas,
    recibos,
    productos,
  });
  if (!dist.length) return { estado: "sin_diferencia", motivo: "sin_facturas_aplicadas" };

  let totalUSD = 0;
  let totalOriginalArs = 0;
  let totalCobroArs = 0;
  const detalles = [];

  for (const ap of dist) {
    const fac = facturas.find((f) => String(f.id) === String(ap.facturaId) && !f.anulado);
    if (!fac) continue;
    const usd = num(ap.montoUSD);
    if (usd <= 0) continue;
    const tcOriginal = facturaTcHistorico(fac, cotizaciones);
    const originalArs = usd * tcOriginal;
    const cobroArs = usd * tcPago;
    const diferenciaArs = cobroArs - originalArs;
    totalUSD += usd;
    totalOriginalArs += originalArs;
    totalCobroArs += cobroArs;
    detalles.push({
      facturaId: String(fac.id),
      facBaseId: String(facturaBaseId(fac)),
      fechaFactura: String(fac.fecha || "").slice(0, 10),
      aplicadoUSD: roundMoney(usd, 6),
      tcOriginal: roundMoney(tcOriginal, 6),
      originalArs: roundMoney(originalArs, 2),
      cobroArs: roundMoney(cobroArs, 2),
      diferenciaArs: roundMoney(diferenciaArs, 2),
    });
  }

  if (totalUSD <= 0.000001) return { estado: "sin_diferencia", motivo: "sin_monto_aplicado" };

  const diferenciaArs = totalCobroArs - totalOriginalArs;
  const magnitudArs = Math.abs(diferenciaArs);
  if (magnitudArs < 0.01) {
    return {
      estado: "sin_diferencia",
      totalAplicadoUSD: roundMoney(totalUSD, 6),
      tcCobro: roundMoney(tcPago, 6),
      tcOriginalPromedio: roundMoney(totalOriginalArs / Math.max(totalUSD, 0.000001), 6),
      diferenciaArs: roundMoney(diferenciaArs, 2),
      diferenciaUSD: 0,
      detalles,
    };
  }

  const tipoNota = diferenciaArs > 0 ? "ND" : "NC";
  const montoNotaUSD = magnitudArs / tcPago;
  return {
    estado: "nota_sugerida",
    tipoNota,
    totalAplicadoUSD: roundMoney(totalUSD, 6),
    tcCobro: roundMoney(tcPago, 6),
    tcOriginalPromedio: roundMoney(totalOriginalArs / Math.max(totalUSD, 0.000001), 6),
    diferenciaArs: roundMoney(diferenciaArs, 2),
    diferenciaUSD: roundMoney(diferenciaArs / tcPago, 6),
    montoNotaArs: roundMoney(magnitudArs, 2),
    montoNotaUSD: roundMoney(montoNotaUSD, 6),
    detalles,
  };
};

const buildDifCambioNotaDraft = ({
  sugerencia = null,
  reciboId = "",
  fecha = "",
  clienteId = null,
  facturaId = "",
  montoUSD = null,
  concepto = "",
} = {}) => {
  if (!sugerencia || sugerencia.estado !== "nota_sugerida") return null;
  if (!hasValue(clienteId)) return null;
  const esNd = sugerencia.tipoNota === "ND";
  const refs = Array.from(new Set((sugerencia.detalles || []).map((d) => d?.facBaseId || d?.facturaId).filter(Boolean)));
  const conceptoDefault = `${esNd ? "Diferencia de cambio (cobranza)" : "Saldo a favor por diferencia de cambio (cobranza)"}`
    + `. Recibo ${reciboId || "(pendiente)"}. Facturas: ${refs.join(", ")}.`
    + ` TC orig ${fmt(sugerencia.tcOriginalPromedio, 2)} vs TC cobro ${fmt(sugerencia.tcCobro, 2)}.`;
  const montoOverride = num(String(montoUSD ?? "").replace(",", "."));
  const montoFinal = montoOverride > 0 ? montoOverride : num(sugerencia.montoNotaUSD);
  if (montoFinal <= 0) return null;
  return {
    tipoNota: esNd ? "ND" : "NC",
    key: esNd ? "notasDebito" : "notasCredito",
    label: esNd ? "débito" : "crédito",
    nota: {
      fecha: String(fecha || today()).slice(0, 10),
      origen: "emitida",
      clienteId: +clienteId,
      proveedorId: null,
      facturaId: String(facturaId || refs[0] || ""),
      facturaCompraId: "",
      concepto: String(concepto || conceptoDefault).trim() || conceptoDefault,
      monto: roundMoney(montoFinal, 6),
      autoGeneradaDifCambio: true,
      reciboId: String(reciboId || ""),
      moneda: "USD",
      tcReferencia: roundMoney(sugerencia.tcCobro, 6),
      diferenciaArs: roundMoney(sugerencia.diferenciaArs, 2),
    },
  };
};

const facturaCobradaUSD = (factura, recibos, facturas = [], productos = []) => {
  if (!factura || factura.anulado) return 0;
  const recibosActivos = filterActive(recibos);
  const recibosConAplicaciones = recibosActivos.filter((r) => reciboTieneAplicaciones(r));
  const recibosLegacy = recibosActivos.filter((r) => !reciboTieneAplicaciones(r));
  const allFacturas = Array.isArray(facturas) && facturas.length ? facturas : [factura];
  const baseId = facturaBaseId(factura);
  const lines = allFacturas.filter((f) => facturaBaseId(f) === baseId && !f.anulado);
  const targetLines = lines.length ? lines : [factura];
  const isMulti = targetLines.length > 1;

  const appsByLine = new Map(
    targetLines.map((line) => [
      line.id,
      recibosConAplicaciones.reduce((s, r) => s + reciboAplicadoUSDEnFactura(r, line.id), 0),
    ]),
  );

  const directByLine = new Map(
    targetLines.map((line) => [
      line.id,
      recibosLegacy
        .filter((r) => String(r.facturaId || "") === String(line.id))
        .reduce((s, r) => s + reciboUSD(r), 0) + num(appsByLine.get(line.id)),
    ]),
  );

  let basePool = recibosLegacy
    .filter((r) => {
      const rid = String(r.facturaId || "");
      const rbase = String(r.facturaBaseId || "");
      if (rbase && rbase === String(baseId)) return true;
      return isMulti && rid === String(baseId);
    })
    .reduce((s, r) => s + reciboUSD(r), 0);

  const allocatedByLine = new Map(targetLines.map((line) => [line.id, 0]));
  const linesByCheapest = [...targetLines].sort((a, b) => {
    const totalA = facTotal(a, productos);
    const totalB = facTotal(b, productos);
    if (Math.abs(totalA - totalB) > 0.0001) return totalA - totalB;
    return facturaLineNo(a) - facturaLineNo(b);
  });

  for (const line of linesByCheapest) {
    if (basePool <= 0) break;
    const directPaid = num(directByLine.get(line.id));
    const pendiente = Math.max(0, facTotal(line, productos) - directPaid);
    if (pendiente <= 0) continue;
    const applied = Math.min(basePool, pendiente);
    basePool -= applied;
    allocatedByLine.set(line.id, applied);
  }

  const cobradoRecibos = num(directByLine.get(factura.id)) + num(allocatedByLine.get(factura.id));
  return Math.max(num(factura.cobrado), cobradoRecibos);
};

// ─── 3-TRACK BUSINESS LOGIC ───────────────────────────────────────────────────
function opTracks(op, facturas, remitos, recibos, productos = []) {
  const comprometido = num(op.cantidad);
  const facturasOp = facturas.filter(f => f.opId === op.id && !f.anulado);
  const remitado = remitos.filter(r => r.opId === op.id && !r.anulado).reduce((s, r) => s + num(r.cantidad), 0);
  const facturado = facturasOp.reduce((s, f) => s + num(f.cantidad), 0);
  const totalFacturadoUSD = facturasOp.reduce((s, f) => s + facTotal(f, productos), 0);
  const cobradoUSD = facturasOp.reduce((s, f) => s + facturaCobradaUSD(f, recibos, facturas, productos), 0);
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

const facSaldo = (f, recibos, productos = [], facturas = []) =>
  Math.max(0, facTotal(f, productos) - facturaCobradaUSD(f, recibos, facturas, productos));

function facStatus(f, recibos, productos = [], facturas = []) {
  const t = facTotal(f, productos), c = facturaCobradaUSD(f, recibos, facturas, productos), s = t - c;
  if (s <= 0.01) return "Pagado";
  if (c > 0) return "Parcial";
  if (f.fechaCobro && new Date(f.fechaCobro) < new Date()) return "Vencido";
  return "Pendiente";
}

const compraSubtotal = (c) => hasValue(c?.subtotal) ? num(c.subtotal) : (num(c?.cantidad) * num(c?.precio));
const compraIvaMonto = (c, productos = []) => hasValue(c?.ivaMonto) ? num(c.ivaMonto) : ivaAmount(compraSubtotal(c), compraIvaPct(c, productos));
const compraTotal = (c, productos = []) => hasValue(c?.totalConIva) ? num(c.totalConIva) : (compraSubtotal(c) + compraIvaMonto(c, productos));
const compraSubtotalUSD = (c) => moneyToUSD(compraSubtotal(c), c?.moneda, c?.tc);
const compraIvaMontoUSD = (c, productos = []) => moneyToUSD(compraIvaMonto(c, productos), c?.moneda, c?.tc);
const compraTotalUSD = (c, productos = []) => moneyToUSD(compraTotal(c, productos), c?.moneda, c?.tc);

const compraPagadoUSD = (c) => {
  if (hasValue(c?.pagadoUSD)) return num(c.pagadoUSD);
  return moneyToUSD(c?.pagado, c?.moneda, c?.tc);
};

const compraSaldoUSD = (c) => compraTotalUSD(c) - compraPagadoUSD(c);

function compraStatus(c) {
  const saldo = compraSaldoUSD(c);
  if (num(c.cantRecibida) >= num(c.cantidad)) {
    if (num(c.cantFacturada || 0) < num(c.cantidad)) return "Pend. Factura";
    if (saldo < -0.01) return "Saldo a favor";
    return saldo <= 0.01 ? "Completa" : "Pend. Pago";
  }
  return num(c.cantRecibida) > 0 ? "Parcial" : "Pendiente";
}

const reciboCompraImpactaCuenta = (r) =>
  r?.impactaCuenta !== false && String(r?.medioPago || "").toUpperCase() !== "SALDO_A_FAVOR";

const fechaOnOrBefore = (fecha, to) => {
  const limite = String(to || "").slice(0, 10);
  if (!limite) return true;
  const value = String(fecha || "").slice(0, 10);
  if (!value) return true;
  return value <= limite;
};

const saldoProveedorCuentaUSD = ({
  proveedorId,
  fechaHasta = "",
  compras = [],
  facturasCompra = [],
  recibosCompra = [],
  notasDebito = [],
  notasCredito = [],
  productos = [],
  excludeReciboCompraId = null,
} = {}) => {
  if (!hasValue(proveedorId)) return 0;
  const pid = +proveedorId;
  let saldo = 0;

  const comprasProveedorActivas = (compras || []).filter((c) => +c.proveedorId === pid && !c.anulado);
  const refSetsProveedor = buildCompraDocRefSets(comprasProveedorActivas);
  const facturasProveedor = (facturasCompra || [])
    .filter((f) => +f.proveedorId === pid && !f.anulado && isCompraDocLinkedToRefs(f, refSetsProveedor));
  const recibosProveedor = (recibosCompra || [])
    .filter((r) => String(r?.id || "") !== String(excludeReciboCompraId || ""))
    .filter((r) => +r.proveedorId === pid && !r.anulado && isCompraDocLinkedToRefs(r, refSetsProveedor))
    .filter((r) => reciboCompraImpactaCuenta(r));

  const usaComprobantesCompra = facturasProveedor.length > 0 || recibosProveedor.length > 0;
  if (usaComprobantesCompra) {
    facturasProveedor
      .filter((f) => fechaOnOrBefore(f.fecha, fechaHasta))
      .forEach((f) => { saldo += facCompraTotalUSD(f, productos); });
    recibosProveedor
      .filter((r) => fechaOnOrBefore(r.fecha, fechaHasta))
      .forEach((r) => { saldo -= reciboCompraUSD(r); });
  } else {
    comprasProveedorActivas
      .filter((c) => fechaOnOrBefore(c.fecha, fechaHasta))
      .forEach((c) => {
        saldo += compraTotalUSD(c);
        saldo -= compraPagadoUSD(c);
      });
  }

  (notasDebito || [])
    .filter((n) => +n.proveedorId === pid)
    .filter((n) => !n.anulado)
    .filter((n) => String(n?.origen || "").toLowerCase() === "recibida" || hasValue(n?.proveedorId))
    .filter((n) => fechaOnOrBefore(n.fecha, fechaHasta))
    .forEach((n) => { saldo += num(n.monto); });

  (notasCredito || [])
    .filter((n) => +n.proveedorId === pid)
    .filter((n) => !n.anulado)
    .filter((n) => String(n?.origen || "").toLowerCase() === "recibida" || hasValue(n?.proveedorId))
    .filter((n) => fechaOnOrBefore(n.fecha, fechaHasta))
    .forEach((n) => { saldo -= num(n.monto); });

  return saldo;
};

const saldoFavorProveedorDisponibleUSD = (params = {}) =>
  Math.max(0, -saldoProveedorCuentaUSD(params));

const round6 = (v) => Number(num(v).toFixed(6));
const compraCostoUnitUSD = (c) => {
  const precio = num(c?.precio);
  const moneda = String(c?.moneda || "USD").toUpperCase();
  if (moneda === "PESOS" || moneda === "ARS") {
    const tc = num(c?.tc) || 1;
    return precio / tc;
  }
  return precio;
};

function buildStockCosteo(productos = [], compras = [], remitos = []) {
  const stateByProd = new Map();
  for (const p of productos || []) {
    const fallback = num(p?.costoPromedio) || num(p?.costo) || 0;
    stateByProd.set(String(p.id), {
      stock: 0,
      cpp: fallback,
      ultimoCosto: num(p?.ultimoCosto) || fallback,
      fallbackCosto: fallback,
      entradas: 0,
      salidas: 0,
    });
  }

  const movsRaw = [
    ...(compras || [])
      .filter((c) => !c?.anulado && num(c?.cantRecibida) > 0 && hasValue(c?.productoId))
      .map((c) => ({
        fecha: String(c?.recepcion || c?.fecha || "").slice(0, 10),
        tipo: "entrada",
        origen: "compra",
        refId: String(c?.id || ""),
        productoId: +c.productoId,
        cantidad: num(c.cantRecibida),
        costoUnitario: compraCostoUnitUSD(c),
      })),
    ...(remitos || [])
      .filter((r) => !r?.anulado && num(r?.cantidad) > 0 && hasValue(r?.productoId))
      .map((r) => ({
        fecha: String(r?.fecha || "").slice(0, 10),
        tipo: "salida",
        origen: "remito",
        refId: String(r?.id || ""),
        productoId: +r.productoId,
        cantidad: num(r.cantidad),
        costoUnitario: null,
      })),
  ];

  movsRaw.sort((a, b) => {
    const da = String(a.fecha || "9999-12-31");
    const db = String(b.fecha || "9999-12-31");
    if (da !== db) return da.localeCompare(db);
    if (a.tipo !== b.tipo) return a.tipo === "entrada" ? -1 : 1;
    if (a.refId !== b.refId) return a.refId.localeCompare(b.refId);
    return num(a.productoId) - num(b.productoId);
  });

  const movimientosStock = [];
  let seq = 0;
  for (const m of movsRaw) {
    const key = String(m.productoId);
    if (!stateByProd.has(key)) {
      stateByProd.set(key, {
        stock: 0,
        cpp: 0,
        ultimoCosto: 0,
        fallbackCosto: 0,
        entradas: 0,
        salidas: 0,
      });
    }
    const st = stateByProd.get(key);
    const stockAntes = num(st.stock);
    const cppAntes = num(st.cpp) || num(st.fallbackCosto) || 0;
    const qty = num(m.cantidad);

    let costoUnitario = 0;
    let cppDespues = cppAntes;
    let stockDespues = stockAntes;

    if (m.tipo === "entrada") {
      costoUnitario = num(m.costoUnitario);
      stockDespues = stockAntes + qty;
      const valorAntes = stockAntes * cppAntes;
      const valorIngreso = qty * costoUnitario;
      cppDespues = stockDespues > 0 ? (valorAntes + valorIngreso) / stockDespues : costoUnitario;
      st.stock = stockDespues;
      st.cpp = cppDespues;
      st.ultimoCosto = costoUnitario;
      st.entradas += qty;
    } else {
      costoUnitario = cppAntes;
      stockDespues = stockAntes - qty;
      cppDespues = cppAntes;
      st.stock = stockDespues;
      st.cpp = cppDespues;
      st.salidas += qty;
    }

    seq += 1;
    const valorMovimientoUSD = qty * costoUnitario;
    movimientosStock.push({
      id: `MS_${pad4(seq)}`,
      fecha: m.fecha,
      productoId: m.productoId,
      tipo: m.tipo,
      origen: m.origen,
      refId: m.refId,
      cantidad: round6(qty),
      costoUnitario: round6(costoUnitario),
      costoPromedioAntes: round6(cppAntes),
      costoPromedioDespues: round6(cppDespues),
      stockAntes: round6(stockAntes),
      stockDespues: round6(stockDespues),
      valorMovimientoUSD: round6(valorMovimientoUSD),
      valorStockDespuesUSD: round6(stockDespues * cppDespues),
    });
  }

  const productosCosteados = (productos || []).map((p) => {
    const st = stateByProd.get(String(p.id)) || {
      stock: 0,
      cpp: num(p?.costoPromedio) || num(p?.costo) || 0,
      ultimoCosto: num(p?.ultimoCosto) || num(p?.costo) || 0,
      entradas: 0,
      salidas: 0,
    };
    const stockActual = num(st.stock);
    const costoPromedio = num(st.cpp) || num(p?.costoPromedio) || num(p?.costo) || 0;
    const ultimoCosto = num(st.ultimoCosto) || num(p?.ultimoCosto) || num(p?.costo) || 0;
    const valorStock = stockActual * costoPromedio;
    return {
      ...p,
      costoPromedio: round6(costoPromedio),
      ultimoCosto: round6(ultimoCosto),
      stockActual: round6(stockActual),
      valorStock: round6(valorStock),
      totalEntradas: round6(num(st.entradas)),
      totalSalidas: round6(num(st.salidas)),
    };
  });

  return { productos: productosCosteados, movimientosStock };
}

const stockStatus = (s) => s < 0 ? "NEGATIVO" : s === 0 ? "SIN STOCK" : s <= 20 ? "BAJO" : "OK";
const opSelectLabel = (op, clientes, productos) =>
  `${op.id} - ${lookupNombre(clientes, op.clienteId)} - ${lookupNombre(productos, op.productoId)} (${num(op.cantidad)} ${productoUnidad(productos, op.productoId)})`;
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

// ─── ATOM COMPONENTS ─────────────────────────────────────────────────────────
const STATUS_CLS = {
  "OK": "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
  "Pagado": "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
  "Completa": "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
  "Pend. Factura": "bg-violet-50 text-violet-700 border-violet-200",
  "Saldo a favor": "bg-blue-50 text-blue-700 border-blue-200",
  "Vencido": "bg-red-50 text-[#DC2626] border-red-200",
  "NEGATIVO": "bg-red-50 text-[#DC2626] border-red-200",
  "SIN STOCK": "bg-red-50 text-[#DC2626] border-red-200",
  "Pend. Pago": "bg-violet-50 text-violet-700 border-violet-200",
  "Parcial": "bg-amber-50 text-amber-700 border-amber-200",
  "Pendiente": "bg-[#FFF7ED] text-[#B45309] border-[#FCD9AE]",
  "BAJO": "bg-amber-50 text-amber-700 border-amber-200",
};

function Bdg({ s }) {
  const cls = STATUS_CLS[s] || "bg-slate-100 text-slate-600 border-slate-200";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{s}</span>;
}

const IC = "w-full border border-[#D6E3DB] rounded-xl px-3 py-2.5 text-sm text-[#17211B] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A4D]/25 focus:border-[#1F7A4D]";
const IC_COMPACT = "w-full min-w-[88px] h-11 border border-[#D6E3DB] rounded-xl px-2.5 py-2 text-sm font-semibold text-[#17211B] bg-white text-center leading-5 focus:outline-none focus:ring-2 focus:ring-[#1F7A4D]/25 focus:border-[#1F7A4D]";
const normText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const focusNextField = (current) => {
  if (!current || typeof document === "undefined") return;
  const selectors = "input, select, textarea, button, [tabindex]:not([tabindex='-1'])";
  const all = Array.from(document.querySelectorAll(selectors))
    .filter((el) => !el.disabled && el.tabIndex !== -1 && el.offsetParent !== null);
  const idx = all.indexOf(current);
  if (idx >= 0 && idx < all.length - 1) all[idx + 1].focus();
};

function SearchSelect({
  value,
  options = [],
  onChange,
  placeholder = "Seleccionar...",
  emptyLabel = "Sin resultados",
  className = "",
  disabled = false,
  clearable = false,
  clearLabel = "Sin seleccionar",
}) {
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((opt) => String(opt.value) === String(value));
  const filtered = options.filter((opt) => {
    if (!query.trim()) return true;
    const bag = `${opt.label || ""} ${opt.searchText || ""}`;
    return normText(bag).includes(normText(query));
  });
  const display = open ? query : (selected?.label || "");

  useEffect(() => {
    const onDocDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex > filtered.length - 1) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  const selectOption = (opt, moveNext = false) => {
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
    setQuery("");
    if (moveNext) setTimeout(() => focusNextField(inputRef.current), 0);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (filtered.length) setActiveIndex((idx) => (idx + 1) % filtered.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (filtered.length) setActiveIndex((idx) => (idx - 1 + filtered.length) % filtered.length);
      return;
    }
    if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (!filtered.length) return;
      selectOption(filtered[activeIndex] || filtered[0], true);
      return;
    }
    if (e.key === "Tab") {
      if (!open || !filtered.length) return;
      selectOption(filtered[activeIndex] || filtered[0], false);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        className={`${IC} pr-8`}
        value={display}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActiveIndex(0);
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#17211B] disabled:opacity-50"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#D6E3DB] bg-white shadow-[0_10px_26px_rgba(23,33,27,0.14)] max-h-60 overflow-auto">
          {clearable && (
            <button
              type="button"
              className={`w-full px-3 py-2 text-left text-sm border-b border-[#EEF3EF] hover:bg-[#F6F8F5] ${
                !selected ? "text-[#14532D] font-semibold" : "text-[#6B7280]"
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange?.("");
                setOpen(false);
                setQuery("");
              }}
            >
              {clearLabel}
            </button>
          )}
          {filtered.map((opt, idx) => (
            <button
              key={`${String(opt.value)}-${idx}`}
              type="button"
              className={`w-full px-3 py-2 text-left text-sm ${
                idx === activeIndex ? "bg-[#DFF5E8] text-[#14532D]" : "text-[#17211B] hover:bg-[#F6F8F5]"
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(opt, false)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {opt.label}
            </button>
          ))}
          {!filtered.length && <div className="px-3 py-2 text-sm text-[#6B7280]">{emptyLabel}</div>}
        </div>
      )}
    </div>
  );
}

function Fl({ label, children, span2 }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, wide, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white sm:rounded-2xl rounded-t-2xl border border-[#E5ECE7] shadow-[0_24px_48px_rgba(23,33,27,0.22)] w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5ECE7] sticky top-0 bg-white z-10">
          <h3 className="font-bold text-[#17211B]">{title}</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FBtns({ onSave, onCancel, saveLabel = "Guardar" }) {
  return (
    <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[#E5ECE7]">
      <button onClick={onCancel} className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:text-[#17211B]">Cancelar</button>
      <button onClick={onSave} className="bg-[#1F7A4D] hover:bg-[#14532D] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm">{saveLabel}</button>
    </div>
  );
}

// ─── Modal de anulación lógica ──────────────────────────────────────────────
// Pide motivo obligatorio. Marca el registro como anulado en lugar de borrarlo.
function AnularModal({ entityLabel, record, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState("");
  const handleConfirm = () => {
    const m = motivo.trim();
    if (!m) { alert("Debes ingresar un motivo de anulación."); return; }
    onConfirm(m);
  };
  return (
    <Modal title={`Anular ${entityLabel}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">⚠ Anulación lógica</p>
          <p>El registro queda marcado como anulado y deja de impactar en stock, saldos, IVA y cuenta corriente, pero se conserva para auditoría.</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Registro: </span>
          <span className="font-mono font-bold text-gray-800">{record?.id}</span>
        </div>
        <Fl label="Motivo de anulación *">
          <textarea
            className={IC}
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: error de carga, devolución, factura duplicada..."
          />
        </Fl>
      </div>
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[#E5ECE7]">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:text-[#17211B]">Cancelar</button>
        <button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm">Anular registro</button>
      </div>
    </Modal>
  );
}

// Helper: marca un registro como anulado dentro de un array
function aplicarAnulacion(arr, id, motivo, currentUser) {
  return (arr || []).map(r =>
    String(r.id) === String(id)
      ? {
          ...r,
          anulado: true,
          anuladoEl: new Date().toISOString(),
          anuladoPor: currentUser?.usuario || currentUser?.nombre || "—",
          motivoAnulacion: motivo,
        }
      : r,
  );
}

function PageHdr({ title, sub, onNew, btn = "+ Nuevo" }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-[#17211B] leading-tight">{title}</h1>
        {sub && <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5 hidden sm:block">{sub}</p>}
      </div>
      {onNew && <button onClick={onNew} className="bg-[#1F7A4D] hover:bg-[#14532D] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-bold flex-shrink-0">{btn}</button>}
    </div>
  );
}

function DateRangeFilter({ range, onChange, count, total }) {
  const hasFilter = Boolean(range?.from || range?.to);
  return (
    <div className="mb-4 bg-[#DFF5E8]/60 border border-[#CFE9DB] rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="text-xs text-[#14532D] font-semibold uppercase tracking-wider">Rango de fechas</span>
      <input
        type="date"
        className="border border-[#BEE7CF] rounded-xl px-2.5 py-1.5 text-xs bg-white text-[#17211B]"
        value={range?.from || ""}
        onChange={(e) => onChange((r) => ({ ...r, from: e.target.value }))}
      />
      <span className="text-xs text-[#1F7A4D]">a</span>
      <input
        type="date"
        className="border border-[#BEE7CF] rounded-xl px-2.5 py-1.5 text-xs bg-white text-[#17211B]"
        value={range?.to || ""}
        onChange={(e) => onChange((r) => ({ ...r, to: e.target.value }))}
      />
      <button
        type="button"
        onClick={() => onChange({ from: "", to: "" })}
        disabled={!hasFilter}
        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#BEE7CF] text-[#14532D] bg-white hover:bg-[#ECFDF3] disabled:opacity-40"
      >
        Limpiar
      </button>
      {typeof count === "number" && typeof total === "number" && (
        <span className="text-xs text-[#14532D] ml-auto">{count} de {total} registros</span>
      )}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl border border-[#E5ECE7] shadow-[0_8px_24px_rgba(23,33,27,0.06)] overflow-x-auto ${className}`}>{children}</div>;
}

function THead({ cols, compact = false, sticky = false, center = true, green = true }) {
  const cleanHeadLabel = (value) => {
    const raw = String(value ?? "");
    const n = normText(raw).replace(/\s+/g, " ").trim();
    if (n.includes("no poder")) return "Cantidad";
    return raw;
  };
  const alignCls = center ? "text-center" : "text-left";
  const thColorCls = green ? "text-[#14532D]" : "text-[#6B7280]";
  const thCls = compact
    ? `${alignCls} px-2 py-2 text-[10px] ${thColorCls} font-semibold uppercase tracking-wide whitespace-nowrap`
    : `${alignCls} px-4 py-3 ${thColorCls} font-semibold text-xs uppercase tracking-wider whitespace-nowrap`;
  const theadBase = green ? "bg-[#EAF6EF] border-b border-[#D5EBDD]" : "bg-[#F4F6F4] border-b border-[#E5ECE7]";
  const theadCls = sticky
    ? `${theadBase} sticky top-0 z-20`
    : theadBase;
  return (
    <thead className={theadCls}>
      <tr>{cols.map((c, i) => <th key={i} className={thCls}>{cleanHeadLabel(c)}</th>)}</tr>
    </thead>
  );
}

function TR({ children, highlight, rowRef, className = "", highlightTone = "amber" }) {
  const highlightCls = highlight
    ? (highlightTone === "gray" ? "bg-slate-100/80" : "bg-[#FFF7ED]/70")
    : "hover:bg-[#F6F8F5]";
  return <tr ref={rowRef} className={`border-b border-[#F0F3EF] transition-colors text-center ${highlightCls} ${className}`}>{children}</tr>;
}

function TD({ children, right, center = true, mono, bold, gray, green, red, compact = false, nowrap = true }) {
  const sizeCls = compact ? "px-2 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const wrapCls = nowrap ? "whitespace-nowrap" : "whitespace-normal break-words";
  const alignCls = center ? "text-center" : (right ? "text-right" : "");
  return (
    <td className={`${sizeCls} ${wrapCls} ${alignCls} ${mono ? "font-mono text-xs" : ""} ${bold ? "font-semibold" : ""} ${gray ? "text-[#6B7280]" : red ? "text-[#DC2626]" : green ? "text-[#1F7A4D]" : "text-[#17211B]"}`}>
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

// Icono de "anular" (círculo con barra)
function IconBan({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

// Btns: admite Anular y/o Eliminar. Por defecto, si hay onAnular se prioriza ese
// botón; con `showDeleteWithAnular` pueden verse ambos a la vez.
function Btns({ onEdit, onDel, onAnular, onPdf, anulado = false, compact = false, showDeleteWithAnular = false }) {
  const canDelete = useCanDelete();
  const tdCls = compact ? "px-1.5 py-1.5 text-center" : "px-3 py-2.5";
  const btnCls = compact ? "p-1 text-[#374151] hover:text-[#111827] hover:bg-slate-100 rounded-lg" : "p-1.5 text-[#374151] hover:text-[#111827] hover:bg-slate-100 rounded-lg";
  const delBtnCls = compact ? "p-1 text-[#374151] hover:text-[#B91C1C] hover:bg-red-50 rounded-lg" : "p-1.5 text-[#374151] hover:text-[#B91C1C] hover:bg-red-50 rounded-lg";
  const pdfBtnCls = compact ? "p-1 text-[#374151] hover:text-[#1F7A4D] hover:bg-emerald-50 rounded-lg" : "p-1.5 text-[#374151] hover:text-[#1F7A4D] hover:bg-emerald-50 rounded-lg";
  const iconSz = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <td className={tdCls}>
      <div className={compact ? "flex justify-center gap-0.5" : "flex gap-1"}>
        {onPdf && !anulado && (
          <button onClick={onPdf} className={pdfBtnCls} title="Descargar PDF" aria-label="PDF">
            <FileDown className={iconSz} />
          </button>
        )}
        {!anulado && (
          <button onClick={onEdit} className={btnCls} title="Editar" aria-label="Editar">
            <IconPencil className={iconSz} />
          </button>
        )}
        {canDelete && onAnular && !anulado && (
          <button onClick={onAnular} className={delBtnCls} title="Anular" aria-label="Anular">
            <IconBan className={iconSz} />
          </button>
        )}
        {canDelete && onDel && (!onAnular || showDeleteWithAnular) && (
          <button onClick={onDel} className={delBtnCls} title="Eliminar" aria-label="Eliminar">
            <IconTrash className={iconSz} />
          </button>
        )}
        {anulado && (
          <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded">ANULADO</span>
        )}
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
    case "target":
      return <svg {...props}><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
    case "profit":
      return <svg {...props}><path d="M3 18h18" /><path d="M6 15l4-4 3 3 5-6" /><path d="M16 8h2v2" /></svg>;
    case "truck":
      return <svg {...props}><path d="M3 7h11v9H3zM14 10h3l3 3v3h-6z" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></svg>;
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

// ─── 3-TRACK BAR ─────────────────────────────────────────────────────────────
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

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
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

function TrackPanelCompras({ tracks, compact = false }) {
  return (
    <div className={`${compact ? "space-y-1 py-0 w-full min-w-0" : "space-y-1.5 py-0.5 min-w-52"}`}>
      <TrackBar label={compact ? "Rec." : "Remito"} value={tracks.remitado} max={Math.max(tracks.comprometido, 1)} color="blue" compact={compact} />
      <TrackBar label={compact ? "Fac." : "Factura"} value={tracks.facturado} max={Math.max(tracks.comprometido, 1)} color="violet" compact={compact} />
      <TrackBar label={compact ? "Pago" : "Recibo"} value={tracks.cobradoUSD} max={Math.max(tracks.totalFacturadoUSD, 0.01)} color="green" isUSD compact={compact} />
    </div>
  );
}

function QuickActionsCompra({ compra, tracks, onQR, onQF, onQP, compact = false }) {
  const showRemito = tracks.pendEntrega > 0.01;
  const showFactura = tracks.pendFacturar > 0.01;
  const showPago = tracks.pendCobrar > 0.01;

  if (!showRemito && !showFactura && !showPago) {
    return <span className="text-xs text-gray-300">Sin pendientes</span>;
  }

  return (
    <div className={`flex flex-col gap-1 ${compact ? "w-full min-w-0" : "min-w-[170px]"}`}>
      {showRemito && (
        <button onClick={() => onQR(compra, tracks)} className={`w-full px-2 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold border border-blue-100 whitespace-nowrap`}>
          Remito ({fmt(tracks.pendEntrega, 2)})
        </button>
      )}
      {showFactura && (
        <button onClick={() => onQF(compra, tracks)} className={`w-full px-2 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg font-semibold border border-violet-100 whitespace-nowrap`}>
          Factura ({fmt(tracks.pendFacturar, 2)})
        </button>
      )}
      {showPago && (
        <button onClick={() => onQP(compra, tracks)} className={`w-full px-2 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-semibold border border-emerald-100 whitespace-nowrap`}>
          Recibo (USD {fmt(tracks.pendCobrar)})
        </button>
      )}
    </div>
  );
}

const SelCliente = ({ val, onChange, clientes, className = "" }) => (
  <SearchSelect
    className={className}
    value={val || ""}
    placeholder="Seleccionar cliente..."
    options={clientes.map((c) => ({
      value: String(c.id),
      label: c.nombre,
      searchText: `${c.nombre} ${c.cuit || ""}`,
    }))}
    onChange={(next) => onChange?.({ target: { value: String(next || "") } })}
    clearable
    clearLabel="Sin cliente"
    emptyLabel="Sin clientes"
  />
);

const SelProd = ({ val, onChange, productos, className = "" }) => (
  <SearchSelect
    className={className}
    value={val || ""}
    placeholder="Seleccionar producto..."
    options={productos.map((p) => ({
      value: String(p.id),
      label: p.nombre,
      searchText: `${p.nombre} ${p.tipo || ""}`,
    }))}
    onChange={(next) => onChange?.({ target: { value: String(next || "") } })}
    clearable
    clearLabel="Sin producto"
    emptyLabel="Sin productos"
  />
);

// ─── OPERACIONES ──────────────────────────────────────────────────────────────
function Operaciones({ data, onUpdate, navTarget, currentUser }) {
  const canDelete = useCanDelete();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [opItems, setOpItems] = useState([{ productoId: "", precio: "", cantidad: "" }]);
  const precioRefs = useRef([]);
  const cantidadRefs = useRef([]);
  const [expandId, setExpandId] = useState(null);
  const [qRem, setQRem] = useState(null);
  const [qFac, setQFac] = useState(null);
  const [qRemGroup, setQRemGroup] = useState(null);
  const [qFacGroup, setQFacGroup] = useState(null);
  const [qRec, setQRec] = useState(null);
  const [opFilter, setOpFilter] = useState("all");
  const [anularOp, setAnularOp] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
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
  const rowRefs = useRef({});
  const {
    operaciones,
    facturas,
    remitos,
    recibos,
    clientes,
    productos,
    vendedores,
    cotizaciones,
    cheques = [],
    notasDebito = [],
    notasCredito = [],
  } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setOpItem = (idx, key, value) => setOpItems(items => items.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  const focusProductoRow = (idx) => {
    setTimeout(() => {
      const el = document.querySelector(`.op-product-select-${idx} input`);
      if (!el) return;
      el.focus();
      if (typeof el.select === "function") el.select();
    }, 0);
  };
  const addOpItem = ({ focus = false } = {}) => setOpItems(items => {
    const next = [...items, { productoId: "", precio: "", cantidad: "" }];
    if (focus) focusProductoRow(next.length - 1);
    return next;
  });
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
  // Anula la(s) operación(es) y en cascada todos los comprobantes vinculados
  const cascadeAnularByOpIds = (opIds = [], motivo) => {
    const ids = Array.from(new Set((opIds || []).map((x) => String(x))));
    if (!ids.length) return;

    const opIdSet = new Set(ids);
    const facturasAfectadas = facturas.filter((f) => opIdSet.has(String(f.opId)) && !f.anulado);
    const facturaIdSet = new Set(facturasAfectadas.map((f) => String(f.id)));
    const facturaBaseSet = new Set(
      facturasAfectadas.map((f) => String(facturaBaseId(f))).filter(Boolean),
    );

    const stamp = {
      anulado: true,
      anuladoEl: new Date().toISOString(),
      anuladoPor: currentUser?.usuario || currentUser?.nombre || "—",
      motivoAnulacion: motivo,
    };

    const nextOperaciones = operaciones.map((o) =>
      opIdSet.has(String(o.id)) && !o.anulado ? { ...o, ...stamp } : o,
    );
    const nextFacturas = facturas.map((f) =>
      opIdSet.has(String(f.opId)) && !f.anulado
        ? { ...f, ...stamp, motivoAnulacion: `Cascada por anulación de ${f.opId}: ${motivo}` }
        : f,
    );
    const nextRemitos = remitos.map((r) =>
      opIdSet.has(String(r.opId)) && !r.anulado
        ? { ...r, ...stamp, motivoAnulacion: `Cascada por anulación de ${r.opId}: ${motivo}` }
        : r,
    );
    const nextRecibos = recibos.map((r) => {
      if (r.anulado) return r;
      const afectado = reciboAfectaFacturas(r, facturaIdSet, facturaBaseSet);
      return afectado ? { ...r, ...stamp, motivoAnulacion: `Cascada por anulación de op vinculada: ${motivo}` } : r;
    });

    onUpdate("operaciones", nextOperaciones);
    onUpdate("facturas", nextFacturas);
    onUpdate("remitos", nextRemitos);
    onUpdate("recibos", nextRecibos);
  };

  const handleAnularOp = (motivo) => {
    const ids = Array.isArray(anularOp.lines) ? anularOp.lines.map(l => l.id) : [anularOp.id];
    cascadeAnularByOpIds(ids, motivo);
    setAnularOp(null);
  };
  const cascadeDeleteByOpIds = (opIds = []) => {
    const ids = Array.from(new Set((opIds || []).map((x) => String(x))));
    if (!ids.length) return;
    const opIdSet = new Set(ids);
    const facturasAfectadas = facturas.filter((f) => opIdSet.has(String(f.opId)));
    const facturaIdSet = new Set(facturasAfectadas.map((f) => String(f.id)));
    const facturaBaseSet = new Set(facturasAfectadas.map((f) => String(facturaBaseId(f))).filter(Boolean));
    const nextOperaciones = operaciones.filter((o) => !opIdSet.has(String(o.id)));
    const nextFacturas = facturas.filter((f) => !opIdSet.has(String(f.opId)));
    const nextRemitos = remitos.filter((r) => !opIdSet.has(String(r.opId)));
    const nextRecibos = recibos.filter((r) => {
      const afectado = reciboAfectaFacturas(r, facturaIdSet, facturaBaseSet);
      return !afectado;
    });
    const recibosEliminados = recibos.filter((r) => !nextRecibos.some((x) => String(x.id) === String(r.id)));
    const chequeIdSet = new Set(recibosEliminados.map((r) => String(r.chequeId || "")).filter(Boolean));
    const nextCheques = chequeIdSet.size
      ? cheques.filter((ch) => !chequeIdSet.has(String(ch.id)))
      : cheques;
    onUpdate("operaciones", nextOperaciones, { action: "ELIMINAR", detail: `Eliminación física de ${ids.length} operación(es)` });
    onUpdate("facturas", nextFacturas, { action: "ELIMINAR", detail: `Eliminadas facturas vinculadas (${facturasAfectadas.length})` });
    onUpdate("remitos", nextRemitos, { action: "ELIMINAR", detail: "Eliminados remitos vinculados" });
    onUpdate("recibos", nextRecibos, { action: "ELIMINAR", detail: "Eliminados recibos vinculados a facturas eliminadas" });
    if (nextCheques !== cheques) onUpdate("cheques", nextCheques, { action: "ELIMINAR", detail: "Eliminados cheques vinculados a recibos eliminados" });
  };
  const handleDeleteGroup = (group) => {
    if (!canDelete) return;
    const ids = group?.lines?.map((x) => x.id) || [];
    if (!ids.length) return;
    if (!confirm(`¿Eliminar definitivamente ${ids.length} línea(s) de ${group.key} y sus comprobantes vinculados?`)) return;
    cascadeDeleteByOpIds(ids);
  };
  const handleDeleteLinea = (op) => {
    if (!canDelete) return;
    if (!op?.id) return;
    if (!confirm(`¿Eliminar definitivamente ${op.id} y sus comprobantes vinculados?`)) return;
    cascadeDeleteByOpIds([op.id]);
  };

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
    const unidad = productoUnidad(productos, op.productoId);
    if (qty > tracks.pendEntrega) return alert(`No podes remitar mas de lo pendiente (${fmt(tracks.pendEntrega, 2)} ${unidad}).`);
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
    const unidad = productoUnidad(productos, op.productoId);
    if (qty > pendGlobal) return alert(`No podes facturar mas de lo pendiente (${fmt(pendGlobal, 2)} ${unidad}).`);
    const iva = productoIvaPct(productos, qFac.productoId);
    const tcInfo = construirTC(cotizaciones, qFac.fecha);
    const n = data.cnt.fac + 1;
    const facId = `F_${pad4(n)}`;
    onUpdate("facturas", [...facturas, {
      id: facId,
      facBaseId: facId,
      facLine: 1,
      numeroFactura: String(qFac.numeroFactura || "").trim(),
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
      tcFactura: tcInfo.tc,
      tcFuente: tcInfo.tcFuente,
      tcFecha: tcInfo.tcFecha,
      tcId: tcInfo.tcId,
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
        unidad: productoUnidad(productos, op.productoId),
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
    if (invalid) return alert(`La cantidad de ${invalid.producto} supera lo pendiente (${fmt(invalid.max, 2)} ${invalid.unidad || "u."}).`);

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
        unidad: productoUnidad(productos, op.productoId),
        precio: op.precio,
        ivaPct: opIvaPct(op, productos),
        max: pendGlobal,
        cantidad: pendGlobal,
        selected: pendGlobal > 0,
      };
    });
    if (!items.some(i => i.max > 0)) return alert("No hay productos pendientes de factura.");
    setQFacGroup({ key: group.key, numeroFactura: "", fecha: today(), fechaCobro: "", items });
  };

  const saveQFacGroup = () => {
    const selected = qFacGroup.items.filter(i => i.selected && num(i.cantidad) > 0);
    if (!selected.length) return alert("Selecciona al menos un producto para facturar.");
    const invalid = selected.find(i => num(i.cantidad) > num(i.max));
    if (invalid) return alert(`La cantidad de ${invalid.producto} supera lo pendiente de factura (${fmt(invalid.max, 2)} ${invalid.unidad || "u."}).`);

    const next = data.cnt.fac + 1;
    const facBase = `F_${pad4(next)}`;
    const tcInfo = construirTC(cotizaciones, qFacGroup.fecha);
    const nuevos = selected.map((it, idx) => {
      const op = operaciones.find((o) => o.id === it.opId);
      return {
      id: selected.length === 1 ? facBase : `${facBase}-${idx + 1}`,
      facBaseId: facBase,
      facLine: idx + 1,
      numeroFactura: String(qFacGroup.numeroFactura || "").trim(),
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
      tcFactura: tcInfo.tc,
      tcFuente: tcInfo.tcFuente,
      tcFecha: tcInfo.tcFecha,
      tcId: tcInfo.tcId,
    };
    });
    onUpdate("facturas", [...facturas, ...nuevos]);
    onUpdate("cnt", { ...data.cnt, fac: next });
    setQFacGroup(null);
  };

  const saldoFacturaUSD = (facturaRef, recibosCtx = recibos) => {
    const facLines = facturaLinesByRef(facturaRef, facturas);
    if (!facLines.length) return 0;
    return facLines.reduce((s, f) => s + facSaldo(f, recibosCtx, productos, facturas), 0);
  };
  const montoAutoCobro = (facturaRef) => {
    const saldo = saldoFacturaUSD(facturaRef);
    return saldo > 0 ? Number(saldo.toFixed(2)) : "";
  };
  const facturaPendienteParaOps = (opIds, scope = "detail") => {
    const facLines = facturas.filter((f) => opIds.includes(f.opId));
    if (!facLines.length) return "";
    if (scope === "group") {
      const baseIds = Array.from(new Set(facLines.map((f) => facturaBaseId(f))));
      return baseIds.find((id) => saldoFacturaUSD(id) > 0.01) || "";
    }
    return facLines.find((f) => facSaldo(f, recibos, productos, facturas) > 0.01)?.id || "";
  };
  const tcRapidoCobro = () => construirTC(cotizaciones, today());
  const resolverTcRapidoCobro = async () => {
    const local = tcRapidoCobro();
    if (local.tcFuente !== "fallback") return local;
    try {
      const r = await fetchApi("/api/cotizacion/actual");
      if (!r.ok) return local;
      const j = await r.json();
      const cot = j?.cotizacion;
      const venta = num(cot?.venta);
      if (venta > 0) {
        return {
          tc: venta,
          tcFuente: cot?.fuente || "BNA",
          tcFecha: cot?.fecha || null,
          tcId: cot?.id || null,
        };
      }
    } catch {
      // Si no responde la API, mantenemos fallback local sin bloquear el cobro.
    }
    return local;
  };
  const openQRec = async ({ clienteId, facturaId, concepto, monto, opId, opIds, scope }) => {
    const tcInfo = await resolverTcRapidoCobro();
    setQRec({
      clienteId: clienteId || "",
      facturaId: facturaId || "",
      concepto: concepto || "",
      monto: monto ?? "",
      moneda: "DOLAR",
      tc: tcInfo.tc,
      tcFuente: tcInfo.tcFuente,
      tcFecha: tcInfo.tcFecha,
      tcId: tcInfo.tcId,
      medioPago: "EFECTIVO",
      chequeNumero: "",
      chequeBanco: "",
      chequeFechaEmision: today(),
      chequePlazoDias: 0,
      chequeFechaVencimiento: "",
      chequeEstado: "en_cartera",
      notaDifPreparada: false,
      notaDifGenerar: false,
      notaDifMontoUSD: "",
      notaDifConcepto: "",
      fecha: today(),
      _opId: opId,
      _opIds: opIds,
      _scope: scope,
    });
  };

  const saveQRec = () => {
    const monto = num(qRec.monto);
    if (monto <= 0) return alert("Ingresa un monto mayor a 0.");
    let clienteId = hasValue(qRec.clienteId) ? +qRec.clienteId : null;
    if (qRec.facturaId) {
      const facLines = facturaLinesByRef(qRec.facturaId, facturas);
      const fac = facLines[0];
      if (!facLines.length || !fac) return alert("La factura asociada no existe.");
      if (!clienteId && hasValue(fac.clienteId)) clienteId = +fac.clienteId;
      if (!clienteId) {
        const op = operaciones.find((o) => o.id === fac.opId);
        if (op?.clienteId) clienteId = +op.clienteId;
      }
      const saldo = saldoFacturaUSD(qRec.facturaId);
      const usd = moneyToUSD(monto, qRec.moneda, qRec.tc);
      if (usd > saldo + 0.01) return alert(`Ese cobro supera el saldo de la factura (USD ${fmt(saldo)}).`);
    }
    const facturaExacta = facturas.find((f) => String(f.id) === String(qRec.facturaId || ""));
    const isFacturaBase = Boolean(qRec.facturaId) && !facturaExacta;
    const n = data.cnt.rec + 1;
    const recId = `RC_${pad4(n)}`;
    let nextCnt = { ...data.cnt, rec: n };
    let chequeId = null;
    let nextCheques = cheques;
    const esCheque = isChequeMedio(qRec.medioPago);
    if (esCheque) {
      if (!qRec.chequeNumero || !qRec.chequeBanco) return alert("Para cheque, completa número y banco.");
      const fechaEmision = String(qRec.chequeFechaEmision || qRec.fecha || today()).slice(0, 10);
      const fechaVencimiento = calcFechaVencCheque({
        fechaEmision,
        plazoDias: qRec.chequePlazoDias,
        fechaVencimiento: qRec.chequeFechaVencimiento,
      });
      if (!fechaEmision || !fechaVencimiento) return alert("Para cheque, completa fecha de emisión y vencimiento.");
      const nChk = num(nextCnt.chk) + 1;
      chequeId = `CHK_${pad4(nChk)}`;
      nextCnt = { ...nextCnt, chk: nChk };
      const estado = CHEQUE_ESTADOS.includes(qRec.chequeEstado) ? qRec.chequeEstado : "en_cartera";
      nextCheques = [
        ...cheques,
        {
          id: chequeId,
          tipo: chequeTipoFromMedio(qRec.medioPago),
          numero: String(qRec.chequeNumero || "").trim(),
          banco: String(qRec.chequeBanco || "").trim(),
          importe: monto,
          moneda: qRec.moneda,
          tc: num(qRec.tc) || 1,
          fechaEmision,
          plazoDias: hasValue(qRec.chequePlazoDias) ? num(qRec.chequePlazoDias) : 0,
          fechaVencimiento,
          clienteOrigen: clienteId || null,
          proveedorDestino: null,
          reciboId: recId,
          estado,
          fechaEstado: new Date().toISOString(),
          historialEstados: [
            {
              fecha: new Date().toISOString(),
              estado,
              usuario: currentUser?.usuario || currentUser?.nombre || "—",
              observacion: `Alta desde cobro rápido ${recId}`,
            },
          ],
        },
      ];
    }
    const apps = !isFacturaBase && qRec.facturaId
      ? normalizeReciboAplicaciones([{ facturaId: qRec.facturaId, montoUSD: moneyToUSD(monto, qRec.moneda, qRec.tc) }])
      : [];
    const montoUsdRecibo = moneyToUSD(monto, qRec.moneda, qRec.tc);
    const difCambioSugerida = sugerirDifCambioCobro({
      facturaRef: qRec.facturaId,
      aplicaciones: apps,
      montoUSD: montoUsdRecibo,
      moneda: qRec.moneda,
      tcCobro: qRec.tc,
      facturas,
      recibos,
      productos,
      cotizaciones,
    });
    let difCambioEstado = difCambioSugerida?.estado || "sin_diferencia";
    let notaDifCambio = null;
    if (difCambioSugerida?.estado === "nota_sugerida") {
      if (qRec.notaDifGenerar && !clienteId) {
        return alert("Para generar la nota sugerida, el recibo debe tener cliente.");
      }
      if (qRec.notaDifGenerar && clienteId) {
        const draft = buildDifCambioNotaDraft({
          sugerencia: difCambioSugerida,
          reciboId: recId,
          fecha: qRec.fecha,
          clienteId,
          facturaId: String(qRec.facturaId || apps[0]?.facturaId || ""),
          montoUSD: qRec.notaDifMontoUSD,
          concepto: qRec.notaDifConcepto,
        });
        if (!draft) return alert("No se pudo preparar la nota sugerida. Revisa monto y cliente.");
        const cntKey = draft.key === "notasDebito" ? "nd" : "nc";
        const pref = draft.key === "notasDebito" ? "ND_" : "NC_";
        const nextNota = num(nextCnt[cntKey]) + 1;
        const notaId = `${pref}${pad4(nextNota)}`;
        notaDifCambio = { key: draft.key, nota: { ...draft.nota, id: notaId } };
        nextCnt = { ...nextCnt, [cntKey]: nextNota };
        difCambioEstado = "nota_emitida";
      }
    }
    const diferenciaCambio = qRec.facturaId
      ? {
          ...difCambioSugerida,
          estado: difCambioEstado,
          fechaDeteccion: new Date().toISOString(),
          reciboId: recId,
        }
      : null;
    onUpdate("recibos", [...recibos, {
      id: recId,
      fecha: qRec.fecha,
      clienteId,
      facturaId: qRec.facturaId || "",
      ...(isFacturaBase ? { facturaBaseId: qRec.facturaId } : {}),
      facturasAplicadas: apps,
      concepto: qRec.concepto || "",
      monto,
      moneda: qRec.moneda,
      tc: +qRec.tc,
      tcFuente: qRec.tcFuente || "manual",
      tcFecha: qRec.tcFecha || null,
      tcId: qRec.tcId || null,
      medioPago: qRec.medioPago,
      chequeId,
      ...(diferenciaCambio ? { diferenciaCambio } : {}),
    }]);
    if (notaDifCambio) onUpdate(notaDifCambio.key, [...(notaDifCambio.key === "notasDebito" ? notasDebito : notasCredito), notaDifCambio.nota]);
    if (nextCheques !== cheques) onUpdate("cheques", nextCheques);
    onUpdate("cnt", nextCnt);
    setQRec(null);
  };

  const subtotal = opItems.reduce((s, it) => s + num(it.precio) * num(it.cantidad), 0);
  const subtotalIva = opItems.reduce((s, it) => {
    const base = num(it.precio) * num(it.cantidad);
    return s + ivaAmount(base, productoIvaPct(productos, it.productoId));
  }, 0);
  const subtotalTotal = subtotal + subtotalIva;
  const openAnularGroup = (group) => setAnularOp(group);
  const openAnularLinea = (op) => setAnularOp({ id: op.id, key: op.id, lines: [op] });
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
  const filteredGroups = opGroups
    .filter((g) => activeFilter.match(g) && inDateRange(g.head?.fecha, dateRange))
    .filter((g) => showAnulados || !g.lines.every(l => l.anulado));
  const opTargetId = navTarget?.module === "operaciones" ? String(navTarget?.id || "") : "";
  const opTargetGroup = opTargetId
    ? opGroups.find((g) =>
      String(g.key) === opTargetId
      || g.lines.some((o) => String(o.id) === opTargetId || String(o.opBaseId || "") === opTargetId))
    : null;
  const opTargetGroupKey = opTargetGroup?.key ? String(opTargetGroup.key) : "";

  useEffect(() => {
    if (!opTargetGroupKey) return;
    if (opTargetGroup?.multi) setExpandId(opTargetGroupKey);
    const t0 = setTimeout(() => {
      rowRefs.current[opTargetGroupKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t0);
  }, [opTargetGroupKey, opTargetGroup?.multi, navTarget?.ts]);

  return (
    <div>
      <PageHdr title="Operaciones Comerciales" onNew={openNew} btn="+ Nueva Operacion" />
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
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
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
            <THead compact sticky center green cols={["", "ID", "Fecha", "Cliente", "Producto", "Cantidad", "P.USD", "Total", "Prog.", "Acciones", ""]} />
          <tbody>
            {filteredGroups.map(group => {
              const exp = expandId === group.key;
              const head = group.head;
              const tracks = group.tracks;
              const pendFacturaGroup = Math.max(0, tracks.comprometido - tracks.facturado);
              const isNavTargetGroup = !!opTargetGroupKey && String(group.key) === opTargetGroupKey;
              const isWarnGroup = !tracks.done && (tracks.pendFacturar > 0 || tracks.pendCobrar > 0.01);
              return (
                <Fragment key={group.key}>
                  <TR
                    key={group.key}
                    rowRef={(el) => { rowRefs.current[group.key] = el; }}
                    highlight={isNavTargetGroup || isWarnGroup}
                    highlightTone={isNavTargetGroup ? "gray" : "amber"}
                  >
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
                                const facPendId = facturaPendienteParaOps(opIds, "group");
                                openQRec({
                                  clienteId: head.clienteId || "",
                                  facturaId: facPendId || "",
                                  concepto: `Cobro ${group.key}`,
                                  monto: facPendId ? montoAutoCobro(facPendId) : "",
                                  opId: group.key,
                                  opIds,
                                  scope: "group",
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
                            numeroFactura: "",
                            fecha: today(),
                            cantidad: Math.max(0, num(op.cantidad) - t.facturado),
                            precioUnit: op.precio,
                            ivaPct: opIvaPct(op, productos),
                            fechaCobro: "",
                          })}
                          onQC={(op) => {
                            const opIds = [op.id];
                            const facPendId = facturaPendienteParaOps(opIds, "detail");
                            openQRec({
                              clienteId: op.clienteId,
                              facturaId: facPendId || "",
                              concepto: `Cobro ${op.id}`,
                              monto: facPendId ? montoAutoCobro(facPendId) : "",
                              opId: op.id,
                              opIds,
                              scope: "detail",
                            });
                          }}
                        />
                      )}
                    </td>
                    {group.multi
                      ? (
                        <td className="px-1.5 py-1.5 align-middle text-center">
                          <div className="flex justify-center gap-0.5">
                            {canDelete && !group.lines.every(l => l.anulado) && (
                              <button onClick={() => openAnularGroup(group)} className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Anular" aria-label="Anular">
                                <IconBan className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDeleteGroup(group)} className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Eliminar" aria-label="Eliminar">
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )
                      : <Btns compact anulado={head.anulado} onEdit={() => openEdit(head)} onAnular={() => openAnularLinea(head)} onDel={() => handleDeleteLinea(head)} showDeleteWithAnular />}
                  </TR>
                  {exp && (
                    <tr key={`${group.key}-d`} className="bg-slate-50 border-b border-gray-100">
                      <td colSpan={11} className="px-8 py-4">
                        <table className="w-full text-[11px] table-fixed">
                          <THead compact center green cols={["ID", "Producto", "Cantidad", "P.USD", "Total", "Prog.", "Acciones", ""]} />
                          <tbody>
                            {group.lines.map((op) => {
                              const tt = opTracks(op, facturas, remitos, recibos, productos);
                              const isNavTargetLine = !!opTargetId
                                && (String(op.id) === opTargetId || String(op.opBaseId || "") === opTargetId);
                              const isWarnLine = !tt.done && (tt.pendFacturar > 0 || tt.pendCobrar > 0.01);
                              return (
                                <TR
                                  key={`${group.key}-${op.id}`}
                                  highlight={isNavTargetLine || isWarnLine}
                                  highlightTone={isNavTargetLine ? "gray" : "amber"}
                                >
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
                                        numeroFactura: "",
                                        fecha: today(),
                                        cantidad: Math.max(0, num(op.cantidad) - t.facturado),
                                        precioUnit: op.precio,
                                        ivaPct: opIvaPct(op, productos),
                                        fechaCobro: "",
                                      })}
                                      onQC={(op) => {
                                        const opIds = [op.id];
                                        const facPendId = facturaPendienteParaOps(opIds, "detail");
                                        openQRec({
                                          clienteId: op.clienteId,
                                          facturaId: facPendId || "",
                                          concepto: `Cobro ${op.id}`,
                                          monto: facPendId ? montoAutoCobro(facPendId) : "",
                                          opId: op.id,
                                          opIds,
                                          scope: "detail",
                                        });
                                      }}
                                    />
                                  </td>
                                  <Btns compact anulado={op.anulado} onEdit={() => openEdit(op)} onAnular={() => openAnularLinea(op)} onDel={() => handleDeleteLinea(op)} showDeleteWithAnular />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Vendedor">
              <SearchSelect
                value={form.vendedorId || ""}
                placeholder="Seleccionar vendedor..."
                options={vendedores.map((v) => ({
                  value: String(v.id),
                  label: v.nombre,
                  searchText: v.nombre,
                }))}
                clearable
                clearLabel="Sin vendedor"
                emptyLabel="Sin vendedores"
                onChange={(vendedorId) => setForm((prev) => {
                  const permitidos = vendedorId
                    ? clientes.filter((c) => !hasValue(c.vendedorId) || +c.vendedorId === +vendedorId)
                    : clientes;
                  const clienteVigente = permitidos.some((c) => +c.id === +prev.clienteId) ? prev.clienteId : "";
                  return { ...prev, vendedorId: String(vendedorId || ""), clienteId: clienteVigente };
                })}
              />
            </Fl>
            <Fl label="Cliente *">
              <SelCliente
                val={form.clienteId}
                onChange={e => setForm((prev) => {
                  const nuevoClienteId = e.target.value;
                  const cli = clientes.find((c) => +c.id === +nuevoClienteId);
                  const vendAuto = cli && hasValue(cli.vendedorId) ? String(cli.vendedorId) : prev.vendedorId;
                  return { ...prev, clienteId: nuevoClienteId, vendedorId: vendAuto };
                })}
                clientes={clientesPorVendedor}
              />
            </Fl>
            <Fl label={editId ? "Producto *" : "Productos *"} span2>
              <div className="space-y-3">
                {opItems.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="col-span-6">
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Producto</label>
                      <SelProd
                        className={`op-product-select-${idx}`}
                        val={it.productoId}
                        onChange={e => {
                          const p = productos.find(pr => pr.id === +e.target.value);
                          setOpItem(idx, "productoId", e.target.value);
                          setOpItem(idx, "precio", p?.precio || "");
                        }}
                        productos={productos}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Precio USD</label>
                      <input
                        ref={(el) => { precioRefs.current[idx] = el; }}
                        type="number"
                        step="0.01"
                        className={IC}
                        value={it.precio || ""}
                        onChange={e => setOpItem(idx, "precio", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          const next = cantidadRefs.current[idx];
                          if (next) {
                            next.focus();
                            if (typeof next.select === "function") next.select();
                          }
                        }}
                      />
                    </div>
                    <div className={editId ? "col-span-3" : "col-span-2"}>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cantidad</label>
                      <input
                        ref={(el) => { cantidadRefs.current[idx] = el; }}
                        type="number"
                        className={IC}
                        value={it.cantidad || ""}
                        onChange={e => setOpItem(idx, "cantidad", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (editId) {
                            const obs = document.getElementById("op-obs-input");
                            if (obs) obs.focus();
                            return;
                          }
                          if (idx < opItems.length - 1) {
                            focusProductoRow(idx + 1);
                            return;
                          }
                          addOpItem({ focus: true });
                        }}
                      />
                    </div>
                    {!editId && (
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => delOpItem(idx)}
                          className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30 inline-flex items-center justify-center"
                          disabled={opItems.length === 1}
                          aria-label="Quitar producto"
                          title="Quitar producto"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!editId && (
                  <button type="button" onClick={() => addOpItem({ focus: true })} className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-semibold">
                    + Agregar producto
                  </button>
                )}
              </div>
            </Fl>
            <Fl label="Observaciones" span2>
              <textarea id="op-obs-input" className={IC} rows={2} value={form.obs || ""} onChange={e => sf("obs", e.target.value)} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            Producto: <strong>{lookupNombre(productos, qRem.productoId)}</strong> - Pendiente entregar: <strong>{fmt(num(qRem.cantidad), 2)} {productoUnidad(productos, qRem.productoId)}</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            Pendiente de factura: <strong>{fmt(num(qFac.cantidad), 2)} {productoUnidad(productos, qFac.productoId)}</strong> - podes facturar menos si el cliente lo solicita.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Nro Factura (manual)">
              <input type="text" className={IC} value={qFac.numeroFactura || ""} onChange={e => setQFac(f => ({ ...f, numeroFactura: e.target.value }))} />
            </Fl>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Nro Factura (manual)">
              <input type="text" className={IC} value={qFacGroup.numeroFactura || ""} onChange={e => setQFacGroup(g => ({ ...g, numeroFactura: e.target.value }))} />
            </Fl>
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
            const facturaExacta = facturas.find((f) => String(f.id) === String(qRec.facturaId || ""));
            const appsPreview = qRec.facturaId && facturaExacta
              ? normalizeReciboAplicaciones([{ facturaId: qRec.facturaId, montoUSD: moneyToUSD(qRec.monto, qRec.moneda, qRec.tc) }])
              : [];
            const difCambioPreview = sugerirDifCambioCobro({
              facturaRef: qRec.facturaId,
              aplicaciones: appsPreview,
              montoUSD: moneyToUSD(qRec.monto, qRec.moneda, qRec.tc),
              moneda: qRec.moneda,
              tcCobro: qRec.tc,
              facturas,
              recibos,
              productos,
              cotizaciones,
            });
            const facOptions = qRec._scope === "group"
              ? Array.from(new Set(facList.map((f) => facturaBaseId(f))))
                .map((id) => ({ id, saldo: saldoFacturaUSD(id) }))
                .filter((x) => x.saldo > 0.01 || x.id === qRec.facturaId)
              : facList
                .map((f) => ({ id: f.id, saldo: facSaldo(f, recibos, productos, facturas) }))
                .filter((x) => x.saldo > 0.01 || x.id === qRec.facturaId);
            return (
              <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={qRec.fecha} onChange={e => setQRec(r => ({ ...r, fecha: e.target.value }))} /></Fl>
            <Fl label="Factura asociada">
              <SearchSelect
                value={qRec.facturaId}
                placeholder="Sin vincular"
                options={facOptions.map((f) => ({
                  value: String(f.id),
                  label: `${f.id} - saldo USD ${fmt(f.saldo)}`,
                  searchText: `${f.id} ${fmt(f.saldo)}`,
                }))}
                clearable
                clearLabel="Sin vincular"
                emptyLabel="Sin facturas pendientes"
                onChange={(facturaId) => {
                  const nextId = String(facturaId || "");
                  setQRec((r) => ({
                    ...r,
                    facturaId: nextId,
                    monto: nextId ? montoAutoCobro(nextId) : r.monto,
                    notaDifPreparada: false,
                    notaDifGenerar: false,
                    notaDifMontoUSD: "",
                    notaDifConcepto: "",
                  }));
                }}
              />
            </Fl>
            <Fl label="Moneda">
              <select className={IC} value={qRec.moneda} onChange={e => {
                const nextMoneda = e.target.value;
                setQRec((r) => {
                  const saldoUSD = r.facturaId ? num(montoAutoCobro(r.facturaId)) : null;
                  const nextMonto = saldoUSD != null ? Number(usdToMoney(saldoUSD, nextMoneda, r.tc).toFixed(2)) : r.monto;
                  return {
                    ...r,
                    moneda: nextMoneda,
                    monto: nextMonto,
                    notaDifPreparada: false,
                    notaDifGenerar: false,
                    notaDifMontoUSD: "",
                    notaDifConcepto: "",
                  };
                });
              }}>
                <option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option>
              </select>
            </Fl>
            <Fl label={`Tipo de Cambio${qRec.tcFuente ? ` (${qRec.tcFuente})` : ""}`}>
              <input
                type="number"
                className={IC}
                value={qRec.tc}
                onChange={e => {
                  const nextTc = e.target.value;
                  setQRec((r) => {
                    const saldoUSD = r.facturaId ? num(montoAutoCobro(r.facturaId)) : null;
                    const nextMonto = saldoUSD != null ? Number(usdToMoney(saldoUSD, r.moneda, nextTc).toFixed(2)) : r.monto;
                    return {
                      ...r,
                      tc: nextTc,
                      tcFuente: "manual",
                      monto: nextMonto,
                      notaDifPreparada: false,
                      notaDifGenerar: false,
                      notaDifMontoUSD: "",
                      notaDifConcepto: "",
                    };
                  });
                }}
                onFocus={() => { if (qRec.tcFuente && qRec.tcFuente !== "manual") setQRec(r => ({ ...r, tcFuente: "manual" })); }}
              />
            </Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={`${IC} no-spin`} value={qRec.monto} onWheel={e => e.currentTarget.blur()} onChange={e => setQRec(r => ({ ...r, monto: e.target.value, notaDifPreparada: false, notaDifGenerar: false, notaDifMontoUSD: "", notaDifConcepto: "" }))} /></Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={qRec.medioPago} onChange={e => setQRec(r => ({ ...r, medioPago: e.target.value }))}>
                {MEDIOS_PAGO_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Fl>
            {isChequeMedio(qRec.medioPago) && (
              <>
                <Fl label="Nº Cheque *"><input type="text" className={IC} value={qRec.chequeNumero || ""} onChange={e => setQRec(r => ({ ...r, chequeNumero: e.target.value }))} /></Fl>
                <Fl label="Banco *"><input type="text" className={IC} value={qRec.chequeBanco || ""} onChange={e => setQRec(r => ({ ...r, chequeBanco: e.target.value }))} /></Fl>
                <Fl label="Fecha Emisión *"><input type="date" className={IC} value={qRec.chequeFechaEmision || ""} onChange={e => setQRec(r => ({ ...r, chequeFechaEmision: e.target.value }))} /></Fl>
                <Fl label="Plazo (días)">
                  <select className={IC} value={hasValue(qRec.chequePlazoDias) ? qRec.chequePlazoDias : 0} onChange={e => setQRec(r => ({ ...r, chequePlazoDias: e.target.value }))}>
                    {[0, 30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Fl>
                <Fl label="Fecha Vencimiento (exacta)">
                  <input type="date" className={IC} value={qRec.chequeFechaVencimiento || ""} onChange={e => setQRec(r => ({ ...r, chequeFechaVencimiento: e.target.value }))} />
                </Fl>
                <Fl label="Estado cheque">
                  <select className={IC} value={qRec.chequeEstado || "en_cartera"} onChange={e => setQRec(r => ({ ...r, chequeEstado: e.target.value }))}>
                    {CHEQUE_ESTADOS.map((st) => <option key={st} value={st}>{chequeEstadoLabel(st)}</option>)}
                  </select>
                </Fl>
              </>
            )}
            <Fl label="Concepto" span2><input type="text" className={IC} value={qRec.concepto} onChange={e => setQRec(r => ({ ...r, concepto: e.target.value }))} /></Fl>
          </div>
          {difCambioPreview?.estado === "nota_sugerida" && (
            <div className={`mt-2 rounded-xl p-3 text-sm border ${
              difCambioPreview.tipoNota === "ND"
                ? "bg-orange-50 border-orange-100 text-orange-800"
                : "bg-sky-50 border-sky-100 text-sky-800"
            }`}>
              <div className="font-semibold">
                Diferencia de cambio detectada: sugerir Nota de {difCambioPreview.tipoNota === "ND" ? "Débito" : "Crédito"}
              </div>
              <div className="mt-1">
                Monto sugerido: <strong>USD {fmt(difCambioPreview.montoNotaUSD)}</strong> (ARS {fmt(difCambioPreview.montoNotaArs)}).
              </div>
              <div className="text-xs mt-1">
                TC factura promedio {fmt(difCambioPreview.tcOriginalPromedio, 2)} vs TC cobro {fmt(difCambioPreview.tcCobro, 2)}.
              </div>
              {!qRec.notaDifPreparada ? (
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 rounded-lg border border-current text-xs font-semibold hover:bg-white/50"
                  onClick={() => {
                    const facSel = facturaLinesByRef(qRec.facturaId, facturas)[0];
                    const clienteSug = hasValue(qRec.clienteId) ? +qRec.clienteId : (hasValue(facSel?.clienteId) ? +facSel.clienteId : null);
                    const draft = buildDifCambioNotaDraft({
                      sugerencia: difCambioPreview,
                      reciboId: "(pendiente)",
                      fecha: qRec.fecha,
                      clienteId: clienteSug,
                      facturaId: String(qRec.facturaId || ""),
                    });
                    if (!draft) return alert("No se pudo preparar la nota. Verifica cliente y factura.");
                    setQRec((r) => ({
                      ...r,
                      notaDifPreparada: true,
                      notaDifGenerar: false,
                      notaDifMontoUSD: Number(num(draft.nota.monto).toFixed(2)),
                      notaDifConcepto: draft.nota.concepto,
                    }));
                  }}
                >
                  Hacer Nota {difCambioPreview.tipoNota === "ND" ? "de Débito" : "de Crédito"} sugerida
                </button>
              ) : (
                <div className="mt-3 rounded-lg border border-current/30 bg-white/50 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="text-xs">
                      <span className="block mb-1 font-semibold">Monto nota (USD)</span>
                      <input
                        type="number"
                        step="0.01"
                        className={IC}
                        value={qRec.notaDifMontoUSD || ""}
                        onChange={(e) => setQRec((r) => ({ ...r, notaDifMontoUSD: e.target.value, notaDifGenerar: false }))}
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      <span className="block mb-1 font-semibold">Concepto</span>
                      <input
                        type="text"
                        className={IC}
                        value={qRec.notaDifConcepto || ""}
                        onChange={(e) => setQRec((r) => ({ ...r, notaDifConcepto: e.target.value, notaDifGenerar: false }))}
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        qRec.notaDifGenerar
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white border-[#D6E3DB] text-[#17211B] hover:border-emerald-300"
                      }`}
                      onClick={() => setQRec((r) => ({ ...r, notaDifGenerar: true }))}
                    >
                      Generar Nota {difCambioPreview.tipoNota === "ND" ? "de Débito" : "de Crédito"}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white border-[#D6E3DB] text-[#17211B] hover:border-gray-400"
                      onClick={() => setQRec((r) => ({
                        ...r,
                        notaDifPreparada: false,
                        notaDifGenerar: false,
                        notaDifMontoUSD: "",
                        notaDifConcepto: "",
                      }))}
                    >
                      Quitar sugerencia
                    </button>
                    {qRec.notaDifGenerar && <span className="text-xs font-semibold text-emerald-700">Se emitirá al registrar el cobro.</span>}
                  </div>
                </div>
              )}
            </div>
          )}
              </>
            );
          })()}
          <FBtns onSave={saveQRec} onCancel={() => setQRec(null)} saveLabel="Registrar Cobro" />
        </Modal>
      )}
      {anularOp && (
        <AnularModal
          entityLabel={anularOp.lines && anularOp.lines.length > 1 ? `Operación completa (${anularOp.lines.length} líneas + comprobantes)` : "Operación + comprobantes vinculados"}
          record={{ id: anularOp.key || anularOp.id }}
          onClose={() => setAnularOp(null)}
          onConfirm={handleAnularOp}
        />
      )}
    </div>
  );
}

// ─── FACTURACION ──────────────────────────────────────────────────────────────
function Facturacion({ data, onUpdate, currentUser, onNavigate }) {
  const canDelete = useCanDelete();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandId, setExpandId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [anularRec, setAnularRec] = useState(null);
  const [anularGroup, setAnularGroup] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
  const [origenFilter, setOrigenFilter] = useState("emitidas");
  const {
    facturas,
    operaciones,
    remitos,
    recibos,
    productos,
    clientes,
    vendedores,
    cotizaciones,
    facturasCompra = [],
    recibosCompra = [],
    proveedores = [],
  } = data;
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
      numeroFactura: "",
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
  const handleAnularLinea = (motivo) => {
    onUpdate("facturas", aplicarAnulacion(facturas, anularRec.id, motivo, currentUser));
    setAnularRec(null);
  };
  const handleAnularGrupo = (motivo) => {
    const ids = new Set(anularGroup.lines.map((x) => x.id));
    const updated = facturas.map(f => ids.has(f.id) ? {
      ...f,
      anulado: true,
      anuladoEl: new Date().toISOString(),
      anuladoPor: currentUser?.usuario || currentUser?.nombre || "—",
      motivoAnulacion: motivo,
    } : f);
    onUpdate("facturas", updated);
    setAnularGroup(null);
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
    if (qty > disponible) return alert(`No podes facturar mas de lo pendiente (${fmt(disponible, 2)} ${productoUnidad(productos, op.productoId)}).`);

    const rec = {
      ...form,
      numeroFactura: String(form.numeroFactura || "").trim(),
      cantidad: qty,
      precioUnit: +form.precioUnit,
      cobrado: +form.cobrado || 0,
      productoId: +form.productoId,
      ivaPct: ivaPct(form.ivaPct),
      clienteId: op.clienteId || null,
      vendedorId: op.vendedorId || null,
    };
    const tcInfo = construirTC(cotizaciones, form.fecha);
    rec.tcFactura = num(form.tcFactura) || tcInfo.tc;
    rec.tcFuente = form.tcFuente || tcInfo.tcFuente;
    rec.tcFecha = form.tcFecha || tcInfo.tcFecha;
    rec.tcId = form.tcId || tcInfo.tcId;
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
    g.subtotal = g.lines.reduce((s, x) => s + facSubtotal(x), 0);
    g.ivaMonto = g.lines.reduce((s, x) => s + ivaAmount(facSubtotal(x), facturaIvaPct(x, productos)), 0);
    g.total = g.lines.reduce((s, x) => s + facTotal(x, productos), 0);
    g.cobrado = g.lines.reduce((s, x) => s + facturaCobradaUSD(x, recibos, facturas, productos), 0);
    g.saldo = Math.max(0, g.total - g.cobrado);
    const opIds = Array.from(new Set(g.lines.map((x) => String(x.opId || "")).filter(Boolean)));
    g.opIds = opIds;
    g.opLinkId = opIds[0] || "";
    g.opLabel = opIds.length <= 1
      ? (opIds[0] || "-")
      : `${opIds[0]} +${opIds.length - 1}`;
    g.producto = g.multi
      ? `${g.lines.length} productos`
      : lookupNombre(productos, g.head.productoId);
    const numerosFact = Array.from(new Set(g.lines.map((x) => String(x.numeroFactura || "").trim()).filter(Boolean)));
    g.numeroFactura = numerosFact.length === 1 ? numerosFact[0] : (numerosFact.length > 1 ? "Mixto" : "-");
    g.precio = g.multi ? "-" : fmt(g.head.precioUnit);
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
  const filteredFacturas = facturaGroups
    .filter((g) => inDateRange(g.head?.fecha, dateRange))
    .filter((g) => showAnulados || !g.lines.every(l => l.anulado));
  const pagadoByFacturaCompra = buildPagosByFacturaCompra(recibosCompra);
  const filteredFacturasCompra = facturasCompra
    .filter((f) => inDateRange(f.fecha, dateRange))
    .filter((f) => showAnulados || !f.anulado);
  const isEmitidasFact = origenFilter === "emitidas";
  const countFact = isEmitidasFact ? filteredFacturas.length : filteredFacturasCompra.length;
  const totalFact = isEmitidasFact ? facturaGroups.length : facturasCompra.length;

  return (
    <div>
      <PageHdr
        title="Facturacion"
        sub={isEmitidasFact
          ? "La cantidad facturada es independiente del remito (sin superar la operacion)."
          : "Facturas recibidas de proveedores (compras)."}
        onNew={isEmitidasFact ? openNew : null}
        btn="+ Nueva Factura"
      />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <DateRangeFilter range={dateRange} onChange={setDateRange} count={countFact} total={totalFact} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Origen:</span>
          <button
            type="button"
            onClick={() => setOrigenFilter("emitidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isEmitidasFact
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Emitidas
          </button>
          <button
            type="button"
            onClick={() => setOrigenFilter("recibidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              !isEmitidasFact
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Recibidas
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
      </div>
      {isEmitidasFact ? (
        <Card>
          <table className="w-full text-sm">
            <THead cols={["","ID","Nro Fact.","Fecha","Operacion","Cliente","Producto","Cantidad","Precio","Subtotal","IVA","Total c/IVA","Cobrado","Saldo","Vence","Estado",""]} />
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
                      <TD mono gray>{group.numeroFactura}</TD>
                      <TD>{fmtD(group.head.fecha)}</TD>
                      <TD mono gray>
                        {group.opLinkId && onNavigate ? (
                          <button
                            type="button"
                            onClick={() => onNavigate("operaciones", group.opLinkId)}
                            className="underline decoration-dotted underline-offset-2 hover:text-slate-700"
                            title="Ir a operación"
                          >
                            {group.opLabel}
                          </button>
                        ) : group.opLabel}
                      </TD>
                      <TD bold>{group.cliente}</TD>
                      <TD>{group.producto}</TD>
                      <TD right>{group.cantidad}</TD>
                      <TD right>{group.precio}</TD>
                      <TD right>USD {fmt(group.subtotal)}</TD>
                      <TD right>USD {fmt(group.ivaMonto)}</TD>
                      <TD right bold>USD {fmt(group.total)}</TD>
                      <TD right gray>{fmt(group.cobrado)}</TD>
                      <TD right bold>USD {fmt(group.saldo)}</TD>
                      <TD gray>{fmtD(group.vence)}</TD>
                      <td className="px-4 py-2.5"><Bdg s={group.estado} /></td>
                      {group.multi
                        ? (
                          <td className="px-1.5 py-1.5 align-middle text-center">
                            {canDelete && !group.lines.every(l => l.anulado) && (
                              <button onClick={() => setAnularGroup(group)} className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Anular factura">
                                <IconBan className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )
                        : <Btns anulado={group.head.anulado} onEdit={() => openEdit(group.head)} onAnular={() => setAnularRec(group.head)} onPdf={() => descargarFacturaPDF(group.head, data)} />}
                    </TR>
                    {exp && (
                      <tr className="bg-slate-50 border-b border-gray-100">
                        <td colSpan={17} className="px-8 py-4">
                          <table className="w-full text-xs">
                            <THead cols={["ID","Nro Fact.","Operacion","Producto","Cantidad","Precio","Subtotal","IVA","Total c/IVA","Cobrado","Saldo","Vence","Estado",""]} />
                            <tbody>
                              {group.lines.map((f) => {
                                const subtotalL = facSubtotal(f);
                                const ivaMontoL = ivaAmount(subtotalL, facturaIvaPct(f, productos));
                                const totalL = facTotal(f, productos);
                                const cobradoL = facturaCobradaUSD(f, recibos, facturas, productos);
                                const saldoL = facSaldo(f, recibos, productos, facturas);
                                const stL = facStatus(f, recibos, productos, facturas);
                                return (
                                  <TR key={f.id}>
                                    <TD mono gray>{f.id}</TD>
                                    <TD mono gray>{f.numeroFactura || "-"}</TD>
                                    <TD mono gray>
                                      {f.opId && onNavigate ? (
                                        <button
                                          type="button"
                                          onClick={() => onNavigate("operaciones", f.opId)}
                                          className="underline decoration-dotted underline-offset-2 hover:text-slate-700"
                                          title="Ir a operación"
                                        >
                                          {f.opId}
                                        </button>
                                      ) : (f.opId || "-")}
                                    </TD>
                                    <TD>{lookupNombre(productos, f.productoId)}</TD>
                                    <TD right>{f.cantidad}</TD>
                                    <TD right>{fmt(f.precioUnit)}</TD>
                                    <TD right>USD {fmt(subtotalL)}</TD>
                                    <TD right>USD {fmt(ivaMontoL)}</TD>
                                    <TD right bold>USD {fmt(totalL)}</TD>
                                    <TD right gray>{fmt(cobradoL)}</TD>
                                    <TD right bold>USD {fmt(saldoL)}</TD>
                                    <TD gray>{fmtD(f.fechaCobro)}</TD>
                                    <td className="px-4 py-2.5"><Bdg s={stL} /></td>
                                    <Btns compact anulado={f.anulado} onEdit={() => openEdit(f)} onAnular={() => setAnularRec(f)} onPdf={() => descargarFacturaPDF(f, data)} />
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
              {!filteredFacturas.length && <EmptyRow cols={17} />}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <table className="w-full text-xs">
            <THead cols={["ID","Nro Fact. Prov.","Fecha","Compra","Proveedor","Producto","Cantidad","Precio","Subtotal","IVA","Total c/IVA","Pagado","Saldo","Vence","Estado",""]} />
            <tbody>
              {filteredFacturasCompra.map((f) => {
                const subtotalF = facCompraSubtotalUSD(f);
                const ivaMontoF = facCompraIvaMontoUSD(f, productos);
                const totalF = facCompraTotalUSD(f, productos);
                const pagadoF = num(pagadoByFacturaCompra.get(String(f.id)));
                const saldoF = totalF - pagadoF;
                const st = f.anulado ? "Anulado" : (saldoF <= 0.01 ? "Pagada" : (pagadoF > 0 ? "Parcial" : "Pendiente"));
                return (
                  <TR key={f.id} className={f.anulado ? "opacity-50 line-through" : ""}>
                    <TD mono><span className="text-blue-700 font-bold">{f.id}</span></TD>
                    <TD mono gray>{String(f.numeroProveedor || "").trim() || "-"}</TD>
                    <TD>{fmtD(f.fecha)}</TD>
                    <TD mono gray>{f.compraId || f.compraBaseId || "-"}</TD>
                    <TD bold>{lookupNombre(proveedores, f.proveedorId)}</TD>
                    <TD>{lookupNombre(productos, f.productoId)}</TD>
                    <TD right>{fmt(num(f.cantidad), 2)}</TD>
                    <TD right>{fmt(num(f.precioUnit))} {f.moneda || "USD"}</TD>
                    <TD right>USD {fmt(subtotalF)}</TD>
                    <TD right>USD {fmt(ivaMontoF)}</TD>
                    <TD right bold>USD {fmt(totalF)}</TD>
                    <TD right gray>USD {fmt(pagadoF)}</TD>
                    <TD right bold green={saldoF < -0.01} red={saldoF > 0.01}>USD {fmt(saldoF)}</TD>
                    <TD gray>{fmtD(f.fechaVencimiento)}</TD>
                    <td className="px-4 py-2.5"><Bdg s={st} /></td>
                    <td className="px-4 py-2.5 text-center text-gray-300 text-xs">-</td>
                  </TR>
                );
              })}
              {!filteredFacturasCompra.length && <EmptyRow cols={16} />}
            </tbody>
          </table>
        </Card>
      )}
      {modal && (
        <Modal title={editId ? "Editar Factura" : "Nueva Factura"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Nro Factura (manual)">
              <input type="text" className={IC} value={form.numeroFactura || ""} onChange={e => sf("numeroFactura", e.target.value)} />
            </Fl>
            <Fl label="Vendedor">
              <SearchSelect
                value={form.vendedorId || ""}
                placeholder="Todos"
                options={vendedores.map((v) => ({
                  value: String(v.id),
                  label: v.nombre,
                  searchText: v.nombre,
                }))}
                clearable
                clearLabel="Todos"
                emptyLabel="Sin vendedores"
                onChange={(vendedorId) => setForm((prev) => {
                  const permitidos = vendedorId
                    ? clientes.filter((c) => !hasValue(c.vendedorId) || +c.vendedorId === +vendedorId)
                    : clientes;
                  const clienteId = permitidos.some((c) => +c.id === +prev.clienteId) ? prev.clienteId : "";
                  return { ...prev, vendedorId: String(vendedorId || ""), clienteId, opId: "", productoId: "", cantidad: "", precioUnit: "" };
                })}
              />
            </Fl>
            <Fl label="Cliente">
              <SelCliente
                val={form.clienteId}
                onChange={e => setForm((prev) => {
                  const nuevoClienteId = e.target.value;
                  const cli = clientes.find((c) => +c.id === +nuevoClienteId);
                  const vendAuto = cli && hasValue(cli.vendedorId) ? String(cli.vendedorId) : prev.vendedorId;
                  return { ...prev, clienteId: nuevoClienteId, vendedorId: vendAuto, opId: "", productoId: "", cantidad: "", precioUnit: "" };
                })}
                clientes={clientesPorVendedor}
              />
            </Fl>
            <Fl label="Operacion *">
              <SearchSelect
                value={form.opId || ""}
                placeholder="Seleccionar..."
                options={operacionesFiltradas.map((o) => {
                  const tracks = opTracks(o, facturas, remitos, recibos, productos);
                  const pend = Math.max(0, num(o.cantidad) - tracks.facturado);
                  const baseLabel = opSelectLabel(o, data.clientes, productos);
                  const unidad = productoUnidad(productos, o.productoId);
                  return {
                    value: String(o.id),
                    label: `${baseLabel} - pend. ${fmt(pend, 2)} ${unidad}`,
                    searchText: `${o.id} ${lookupNombre(clientes, o.clienteId)} ${lookupNombre(productos, o.productoId)}`,
                  };
                })}
                emptyLabel="Sin operaciones disponibles"
                onChange={(opId) => {
                  const op = operaciones.find(o => o.id === opId);
                  const tracks = op ? opTracks(op, facturas, remitos, recibos, productos) : null;
                  const prod = productoById(productos, op?.productoId);
                  setForm(f => ({
                    ...f,
                    opId: String(opId || ""),
                    vendedorId: op?.vendedorId || f.vendedorId || "",
                    clienteId: op?.clienteId || f.clienteId || "",
                    productoId: op?.productoId || "",
                    precioUnit: op?.precio || "",
                    ivaPct: prod?.iva || 21,
                    cantidad: tracks ? Math.max(0, num(op?.cantidad) - tracks.facturado) : "",
                  }));
                }}
              />
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
              Pendiente de facturar en esta operacion: <strong>{fmt(disponibleSel, 2)} {productoUnidad(productos, form.productoId)}</strong>
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
      {anularRec && (
        <AnularModal
          entityLabel="Factura"
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnularLinea}
        />
      )}
      {anularGroup && (
        <AnularModal
          entityLabel={`Factura completa (${anularGroup.lines.length} líneas)`}
          record={{ id: anularGroup.key }}
          onClose={() => setAnularGroup(null)}
          onConfirm={handleAnularGrupo}
        />
      )}
    </div>
  );
}

// ─── REMITOS ──────────────────────────────────────────────────────────────────
function Remitos({ data, onUpdate, navTarget, currentUser, onNavigate }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [anularRec, setAnularRec] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
  const [origenFilter, setOrigenFilter] = useState("emitidas");
  const rowRefs = useRef({});
  const { remitos, operaciones, facturas, recibos, productos, clientes, remitosCompra = [], proveedores = [] } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setEditId(null); setForm({ fecha: today(), opId: "", productoId: "", cantidad: "", obs: "", lote: "" }); setModal(true); };
  const openEdit = (r) => { setEditId(r.id); setForm({ ...r }); setModal(true); };
  const handleAnular = (motivo) => {
    onUpdate("remitos", aplicarAnulacion(remitos, anularRec.id, motivo, currentUser));
    setAnularRec(null);
  };
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
    if (qty > disponible) return alert(`No podes remitar mas de lo comprometido pendiente (${fmt(disponible, 2)} ${productoUnidad(productos, op.productoId)}).`);

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

  const filteredRemitos = remitos.filter((r) => inDateRange(r.fecha, dateRange) && (showAnulados || !r.anulado));
  const filteredRemitosCompra = remitosCompra.filter((r) => inDateRange(r.fecha, dateRange) && (showAnulados || !r.anulado));
  const isEmitidosRem = origenFilter === "emitidas";
  const countRem = isEmitidosRem ? filteredRemitos.length : filteredRemitosCompra.length;
  const totalRem = isEmitidosRem ? remitos.length : remitosCompra.length;
  return (
    <div>
      <PageHdr
        title="Remitos"
        sub={isEmitidosRem
          ? "Entregas fisicas - independientes de la facturacion"
          : "Remitos recibidos de proveedores (compras)."}
        onNew={isEmitidosRem ? openNew : null}
        btn="+ Nuevo Remito"
      />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <DateRangeFilter range={dateRange} onChange={setDateRange} count={countRem} total={totalRem} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Origen:</span>
          <button
            type="button"
            onClick={() => setOrigenFilter("emitidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isEmitidosRem
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Emitidos
          </button>
          <button
            type="button"
            onClick={() => setOrigenFilter("recibidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              !isEmitidosRem
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Recibidos
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
      </div>
      {isEmitidosRem ? (
        <Card>
          <table className="w-full text-sm">
            <THead cols={["ID","Fecha","Operacion","Cliente","Producto","Cantidad","Lote","Obs.",""]} />
            <tbody>
              {filteredRemitos.map(r => {
                const op = operaciones.find(o => o.id === r.opId);
                const an = r.anulado;
                return (
                  <TR
                    key={r.id}
                    highlight={navTarget?.module === "remitos" && String(navTarget?.id) === String(r.id)}
                    rowRef={(el) => { rowRefs.current[r.id] = el; }}
                    className={an ? "opacity-50 line-through" : ""}
                  >
                    <TD mono><span className="text-emerald-700 font-bold">{r.id}</span></TD>
                    <TD>{fmtD(r.fecha)}</TD>
                    <TD mono gray>
                      {r.opId && onNavigate ? (
                        <button
                          type="button"
                          onClick={() => onNavigate("operaciones", r.opId)}
                          className="underline decoration-dotted underline-offset-2 hover:text-slate-700"
                          title="Ir a operación"
                        >
                          {r.opId}
                        </button>
                      ) : (r.opId || "-")}
                    </TD>
                    <TD bold>{op ? lookupNombre(clientes, op.clienteId) : "-"}</TD>
                    <TD>{lookupNombre(productos, r.productoId)}</TD>
                    <TD right bold green>{fmt(num(r.cantidad), 2)} {productoUnidad(productos, r.productoId)}</TD>
                    <TD gray>{r.lote || "-"}</TD>
                    <TD gray>{r.obs || "-"}</TD>
                    <Btns anulado={an} onEdit={() => openEdit(r)} onAnular={() => setAnularRec(r)} onPdf={() => descargarRemitoPDF(r, data)} />
                  </TR>
                );
              })}
              {!filteredRemitos.length && <EmptyRow cols={9} />}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <THead cols={["ID","Fecha","Compra","Nro Remito Prov.","Proveedor","Producto","Cantidad","Lote","Obs.","Estado"]} />
            <tbody>
              {filteredRemitosCompra.map((r) => (
                <TR key={r.id} className={r.anulado ? "opacity-50 line-through" : ""}>
                  <TD mono><span className="text-blue-700 font-bold">{r.id}</span></TD>
                  <TD>{fmtD(r.fecha)}</TD>
                  <TD mono gray>{r.compraId || r.compraBaseId || "-"}</TD>
                  <TD mono gray>{r.numeroProveedor || "-"}</TD>
                  <TD bold>{lookupNombre(proveedores, r.proveedorId)}</TD>
                  <TD>{lookupNombre(productos, r.productoId)}</TD>
                  <TD right bold green>{fmt(num(r.cantidad), 2)} {productoUnidad(productos, r.productoId)}</TD>
                  <TD gray>{r.lote || "-"}</TD>
                  <TD gray>{r.obs || "-"}</TD>
                  <td className="px-4 py-2.5"><Bdg s={r.anulado ? "Anulado" : "Recibido"} /></td>
                </TR>
              ))}
              {!filteredRemitosCompra.length && <EmptyRow cols={10} />}
            </tbody>
          </table>
        </Card>
      )}
      {modal && (
        <Modal title={editId ? "Editar Remito" : "Nuevo Remito"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Operacion *">
              <SearchSelect
                value={form.opId || ""}
                placeholder="Seleccionar..."
                options={operaciones.map((o) => {
                  const tracks = opTracks(o, facturas, remitos, recibos, productos);
                  const unidad = productoUnidad(productos, o.productoId);
                  return {
                    value: String(o.id),
                    label: `${opSelectLabel(o, data.clientes, productos)} - pend. ${fmt(tracks.pendEntrega, 2)} ${unidad}`,
                    searchText: `${o.id} ${lookupNombre(clientes, o.clienteId)} ${lookupNombre(productos, o.productoId)}`,
                  };
                })}
                emptyLabel="Sin operaciones"
                onChange={(opId) => {
                  const op = operaciones.find((o) => o.id === opId);
                  const tracks = op ? opTracks(op, facturas, remitos, recibos, productos) : null;
                  setForm((f) => ({ ...f, opId: String(opId || ""), productoId: op?.productoId || "", cantidad: tracks ? tracks.pendEntrega : "" }));
                }}
              />
            </Fl>
            <Fl label="Producto"><SelProd val={form.productoId} onChange={e => sf("productoId", e.target.value)} productos={productos} /></Fl>
            <Fl label="Cantidad *"><input type="number" className={IC} value={form.cantidad || ""} onChange={e => sf("cantidad", e.target.value)} /></Fl>
            <Fl label="Lote"><input type="text" className={IC} value={form.lote || ""} onChange={e => sf("lote", e.target.value)} /></Fl>
            <Fl label="Observaciones"><input type="text" className={IC} value={form.obs || ""} onChange={e => sf("obs", e.target.value)} /></Fl>
          </div>
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
      {anularRec && (
        <AnularModal
          entityLabel="Remito"
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}

// ─── RECIBOS ──────────────────────────────────────────────────────────────────
function Recibos({ data, onUpdate, currentUser, onNavigate }) {
  const canDelete = useCanDelete();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [modalCompra, setModalCompra] = useState(false);
  const [editCompraId, setEditCompraId] = useState(null);
  const [formCompra, setFormCompra] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [anularRec, setAnularRec] = useState(null);
  const [anularRecCompra, setAnularRecCompra] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
  const [origenFilter, setOrigenFilter] = useState("emitidas");
  const {
    recibos,
    facturas,
    operaciones,
    clientes,
    productos,
    compras = [],
    cotizaciones,
    cheques = [],
    facturasCompra = [],
    recibosCompra = [],
    proveedores = [],
    notasDebito = [],
    notasCredito = [],
  } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const sfCompra = (k, v) => setFormCompra((f) => ({ ...f, [k]: v }));
  const facturaClienteId = (facturaId) => {
    const fac = facturas.find(f => f.id === facturaId);
    if (fac && hasValue(fac.clienteId)) return +fac.clienteId;
    const op = fac ? operaciones.find(o => o.id === fac.opId) : null;
    return op?.clienteId || "";
  };
  const formAplicacionesNormalizadas = () => normalizeReciboAplicaciones(form?.facturasAplicadas);
  const reciboAplicacionesParaEdicion = (recibo) => {
    const apps = normalizeReciboAplicaciones(recibo?.facturasAplicadas);
    if (apps.length) return apps.map((ap) => ({ facturaId: String(ap.facturaId), montoUSD: Number(num(ap.montoUSD).toFixed(2)) }));
    const facturaId = String(recibo?.facturaId || "");
    if (!facturaId) return [];
    return [{ facturaId, montoUSD: Number(reciboUSD(recibo).toFixed(2)) }];
  };
  const recibosBase = recibos.filter((r) => String(r.id) !== String(editId || ""));
  const saldoFacturaDisponible = (facturaId) => {
    const fac = facturas.find((f) => String(f.id) === String(facturaId));
    if (!fac) return 0;
    return facSaldo(fac, recibosBase, productos, facturas);
  };
  const syncAplicaciones = (nextAppsOrUpdater, extraPatch = null) => {
    setForm((prev) => {
      const current = normalizeReciboAplicaciones(prev?.facturasAplicadas);
      const resolved = typeof nextAppsOrUpdater === "function" ? nextAppsOrUpdater(current, prev) : nextAppsOrUpdater;
      const normalizadas = normalizeReciboAplicaciones(resolved);
      const totalAplicadoUSD = normalizadas.reduce((s, ap) => s + num(ap.montoUSD), 0);
      const montoSugerido = usdToMoney(totalAplicadoUSD, prev.moneda, prev.tc);
      const montoPrevio = num(prev.monto);
      const patch = typeof extraPatch === "function" ? extraPatch(prev, normalizadas) : (extraPatch || {});
      return {
        ...prev,
        ...patch,
        facturasAplicadas: normalizadas,
        aplicadoUSD: Number(totalAplicadoUSD.toFixed(2)),
        facturaId: normalizadas[0]?.facturaId || "",
        notaDifPreparada: false,
        notaDifGenerar: false,
        notaDifMontoUSD: "",
        notaDifConcepto: "",
        monto: normalizadas.length
          ? Number(montoSugerido.toFixed(2))
          : (montoPrevio > 0 ? montoPrevio : prev.monto),
      };
    });
  };
  const toggleAplicacionFactura = (facturaId) => {
    const fid = String(facturaId || "");
    if (!fid) return;
    const clienteFactura = facturaClienteId(fid);
    syncAplicaciones((current) => {
      const exists = current.some((ap) => String(ap.facturaId) === fid);
      if (exists) return current.filter((ap) => String(ap.facturaId) !== fid);
      const saldo = saldoFacturaDisponible(fid);
      return [...current, { facturaId: fid, montoUSD: Number(Math.max(0, saldo).toFixed(2)) }];
    }, (prev) => ({ clienteId: clienteFactura || prev.clienteId }));
  };
  const updateAplicacionMonto = (facturaId, montoUSD) => {
    const fid = String(facturaId || "");
    if (!fid) return;
    syncAplicaciones((current) => current.map((ap) =>
      String(ap.facturaId) === fid ? { ...ap, montoUSD: Number(Math.max(0, num(montoUSD)).toFixed(2)) } : ap,
    ));
  };
  const formCompraAplicacionesNormalizadas = () => normalizeReciboCompraAplicaciones(formCompra?.facturasCompraAplicadas);
  const reciboCompraAplicacionesParaEdicion = (recibo) => {
    const apps = normalizeReciboCompraAplicaciones(recibo?.facturasCompraAplicadas);
    if (apps.length) {
      return apps.map((ap) => ({
        facturaCompraId: String(ap.facturaCompraId),
        compraId: String(ap.compraId || ""),
        compraBaseId: String(ap.compraBaseId || ""),
        montoUSD: Number(num(ap.montoUSD).toFixed(2)),
      }));
    }
    const facturaCompraId = String(recibo?.facturaCompraId || "");
    if (!facturaCompraId) return [];
    const f = facturasCompra.find((x) => String(x.id) === facturaCompraId);
    return [{
      facturaCompraId,
      compraId: String(f?.compraId || recibo?.compraId || ""),
      compraBaseId: String(f?.compraBaseId || recibo?.compraBaseId || ""),
      montoUSD: Number(reciboCompraUSD(recibo).toFixed(2)),
    }];
  };
  const recibosCompraBase = recibosCompra.filter((r) => String(r.id) !== String(editCompraId || ""));
  const pagosByFacturaCompraBase = buildPagosByFacturaCompra(recibosCompraBase);
  const saldoFacturaCompraDisponible = (facturaCompraId) => {
    const fac = facturasCompra.find((f) => String(f.id) === String(facturaCompraId) && !f.anulado);
    if (!fac) return 0;
    const total = facCompraTotalUSD(fac, productos);
    const pagado = num(pagosByFacturaCompraBase.get(String(fac.id)));
    return Math.max(0, total - pagado);
  };
  const syncAplicacionesCompra = (nextAppsOrUpdater, extraPatch = null) => {
    setFormCompra((prev) => {
      const current = normalizeReciboCompraAplicaciones(prev?.facturasCompraAplicadas);
      const resolved = typeof nextAppsOrUpdater === "function" ? nextAppsOrUpdater(current, prev) : nextAppsOrUpdater;
      const normalizadas = normalizeReciboCompraAplicaciones(resolved);
      const totalAppsUsd = normalizadas.reduce((s, ap) => s + num(ap.montoUSD), 0);
      const montoSugerido = usdToMoney(totalAppsUsd, prev.moneda, prev.tc);
      const montoPrevio = num(prev.monto);
      const patch = typeof extraPatch === "function" ? extraPatch(prev, normalizadas) : (extraPatch || {});
      return {
        ...prev,
        ...patch,
        facturasCompraAplicadas: normalizadas,
        aplicadoUSD: Number(totalAppsUsd.toFixed(2)),
        facturaCompraId: normalizadas[0]?.facturaCompraId || "",
        monto: normalizadas.length
          ? Number(montoSugerido.toFixed(2))
          : (montoPrevio > 0 ? montoPrevio : prev.monto),
      };
    });
  };
  const toggleAplicacionFacturaCompra = (facturaCompraId) => {
    const fid = String(facturaCompraId || "");
    if (!fid) return;
    const fac = facturasCompra.find((f) => String(f.id) === fid);
    syncAplicacionesCompra((current) => {
      const exists = current.some((ap) => String(ap.facturaCompraId) === fid);
      if (exists) return current.filter((ap) => String(ap.facturaCompraId) !== fid);
      const saldo = saldoFacturaCompraDisponible(fid);
      return [
        ...current,
        {
          facturaCompraId: fid,
          compraId: String(fac?.compraId || ""),
          compraBaseId: String(fac?.compraBaseId || ""),
          montoUSD: Number(Math.max(0, saldo).toFixed(2)),
        },
      ];
    }, (prev) => ({ proveedorId: fac?.proveedorId || prev.proveedorId }));
  };
  const updateAplicacionMontoCompra = (facturaCompraId, montoUSD) => {
    const fid = String(facturaCompraId || "");
    if (!fid) return;
    syncAplicacionesCompra((current) => current.map((ap) =>
      String(ap.facturaCompraId) === fid
        ? { ...ap, montoUSD: Number(Math.max(0, num(montoUSD)).toFixed(2)) }
        : ap,
    ));
  };
  const openNew = () => {
    setEditId(null);
    const tcInfo = construirTC(cotizaciones, today());
    setForm({
      fecha: today(), clienteId: "", facturaId: "", facturasAplicadas: [], aplicadoUSD: 0, concepto: "", monto: "", moneda: "PESOS", medioPago: "EFECTIVO",
      chequeNumero: "", chequeBanco: "", chequeFechaEmision: today(), chequePlazoDias: 0, chequeFechaVencimiento: "", chequeEstado: "en_cartera",
      notaDifPreparada: false, notaDifGenerar: false, notaDifMontoUSD: "", notaDifConcepto: "",
      ...tcInfo,
    });
    setModal(true);
  };
  const openEdit = (r) => {
    const ch = r?.chequeId ? cheques.find((c) => String(c.id) === String(r.chequeId)) : null;
    const apps = reciboAplicacionesParaEdicion(r);
    setEditId(r.id);
    setForm({
      ...r,
      facturasAplicadas: apps,
      aplicadoUSD: Number(apps.reduce((s, ap) => s + num(ap.montoUSD), 0).toFixed(2)),
      facturaId: String(r?.facturaId || apps[0]?.facturaId || ""),
      chequeNumero: ch?.numero || r?.chequeNumero || "",
      chequeBanco: ch?.banco || r?.chequeBanco || "",
      chequeFechaEmision: ch?.fechaEmision || r?.chequeFechaEmision || r?.fecha || today(),
      chequePlazoDias: hasValue(ch?.plazoDias) ? ch?.plazoDias : (hasValue(r?.chequePlazoDias) ? r.chequePlazoDias : 0),
      chequeFechaVencimiento: ch?.fechaVencimiento || r?.chequeFechaVencimiento || "",
      chequeEstado: ch?.estado || r?.chequeEstado || "en_cartera",
      chequeId: ch?.id || r?.chequeId || null,
      notaDifPreparada: false,
      notaDifGenerar: false,
      notaDifMontoUSD: "",
      notaDifConcepto: "",
    });
    setModal(true);
  };
  const openNewCompra = () => {
    setEditCompraId(null);
    const tcInfo = construirTC(cotizaciones, today());
    setFormCompra({
      fecha: today(),
      proveedorId: "",
      facturaCompraId: "",
      facturasCompraAplicadas: [],
      aplicadoUSD: 0,
      concepto: "",
      monto: "",
      moneda: "USD",
      medioPago: "TRANSFERENCIA",
      chequeSeleccionadoId: "",
      chequeNumero: "",
      chequeBanco: "",
      chequeFechaEmision: today(),
      chequePlazoDias: 0,
      chequeFechaVencimiento: "",
      chequeEstado: "entregado_proveedor",
      ...tcInfo,
    });
    setModalCompra(true);
  };
  const openEditCompra = (r) => {
    const ch = r?.chequeId ? cheques.find((c) => String(c.id) === String(r.chequeId)) : null;
    const apps = reciboCompraAplicacionesParaEdicion(r);
    setEditCompraId(r.id);
    setFormCompra({
      ...r,
      facturasCompraAplicadas: apps,
      aplicadoUSD: Number(apps.reduce((s, ap) => s + num(ap.montoUSD), 0).toFixed(2)),
      facturaCompraId: String(r?.facturaCompraId || apps[0]?.facturaCompraId || ""),
      chequeSeleccionadoId: String(r?.chequeId || ""),
      chequeNumero: ch?.numero || r?.chequeNumero || "",
      chequeBanco: ch?.banco || r?.chequeBanco || "",
      chequeFechaEmision: ch?.fechaEmision || r?.chequeFechaEmision || r?.fecha || today(),
      chequePlazoDias: hasValue(ch?.plazoDias) ? ch?.plazoDias : (hasValue(r?.chequePlazoDias) ? r.chequePlazoDias : 0),
      chequeFechaVencimiento: ch?.fechaVencimiento || r?.chequeFechaVencimiento || "",
      chequeEstado: ch?.estado || r?.chequeEstado || "entregado_proveedor",
      chequeId: ch?.id || r?.chequeId || null,
    });
    setModalCompra(true);
  };
  const handleAnular = (motivo) => {
    onUpdate("recibos", aplicarAnulacion(recibos, anularRec.id, motivo, currentUser));
    if (anularRec?.chequeId) {
      const nextCheques = aplicarAnulacion(cheques, anularRec.chequeId, `Anulación de recibo ${anularRec.id}: ${motivo}`, currentUser)
        .map((ch) => String(ch.id) === String(anularRec.chequeId)
          ? {
              ...ch,
              estado: "anulado",
              fechaEstado: new Date().toISOString(),
              historialEstados: [
                ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
                {
                  fecha: new Date().toISOString(),
                  estado: "anulado",
                  usuario: currentUser?.usuario || currentUser?.nombre || "—",
                  observacion: `Anulado por recibo ${anularRec.id}`,
                },
              ],
            }
          : ch);
      onUpdate("cheques", nextCheques);
    }
    setAnularRec(null);
  };
  const handleAnularCompra = (motivo) => {
    if (!anularRecCompra) return;
    onUpdate("recibosCompra", aplicarAnulacion(recibosCompra, anularRecCompra.id, motivo, currentUser));
    if (anularRecCompra?.chequeId) {
      const nowIso = new Date().toISOString();
      const usuario = currentUser?.usuario || currentUser?.nombre || "-";
      const nextCheques = cheques.map((ch) => {
        if (String(ch.id) !== String(anularRecCompra.chequeId)) return ch;
        if (String(ch.tipo || "") === "terceros") {
          return {
            ...ch,
            estado: "en_cartera",
            proveedorDestino: null,
            compraId: null,
            reciboCompraId: null,
            fechaEstado: nowIso,
            historialEstados: [
              ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
              { fecha: nowIso, estado: "en_cartera", usuario, observacion: `Reversado por anulacion de recibo ${anularRecCompra.id}` },
            ],
          };
        }
        return {
          ...ch,
          estado: "anulado",
          anulado: true,
          anuladoEl: nowIso,
          anuladoPor: usuario,
          motivoAnulacion: `Anulacion de recibo compra ${anularRecCompra.id}: ${motivo}`,
          fechaEstado: nowIso,
        };
      });
      onUpdate("cheques", nextCheques);
    }
    setAnularRecCompra(null);
  };
  const save = () => {
    const aplicaciones = formAplicacionesNormalizadas();
    if (!form.fecha || (!form.monto && !aplicaciones.length)) return alert("Completa Fecha y Monto.");
    let monto = num(form.monto);
    if (monto <= 0 && aplicaciones.length) {
      const totalApps = aplicaciones.reduce((s, ap) => s + num(ap.montoUSD), 0);
      monto = usdToMoney(totalApps, form.moneda, form.tc);
    }
    if (monto <= 0) return alert("El monto debe ser mayor a 0.");

    const montoUSD = moneyToUSD(monto, form.moneda, form.tc);
    let clienteId = hasValue(form.clienteId) ? +form.clienteId : null;
    let totalAplicadoUSD = 0;

    if (aplicaciones.length) {
      const clientesDetectados = new Set();
      for (const ap of aplicaciones) {
        const facturaId = String(ap.facturaId || "");
        const fac = facturas.find((f) => String(f.id) === facturaId && !f.anulado);
        if (!fac) return alert(`La factura ${facturaId} no existe o esta anulada.`);
        const saldo = saldoFacturaDisponible(facturaId);
        if (num(ap.montoUSD) > saldo + 0.01) {
          return alert(`El cobro aplicado a ${facturaId} supera su saldo (USD ${fmt(saldo)}).`);
        }
        const cli = facturaClienteId(facturaId);
        if (cli) clientesDetectados.add(String(cli));
        totalAplicadoUSD += num(ap.montoUSD);
      }
      if (clientesDetectados.size > 1) return alert("Todas las facturas aplicadas deben pertenecer al mismo cliente.");
      const clienteAplicacion = clientesDetectados.size === 1 ? Number(Array.from(clientesDetectados)[0]) : null;
      if (!clienteId && clienteAplicacion) clienteId = clienteAplicacion;
      if (clienteId && clienteAplicacion && String(clienteId) !== String(clienteAplicacion)) {
        return alert("El cliente del recibo no coincide con las facturas aplicadas.");
      }
      if (montoUSD + 0.01 < totalAplicadoUSD) {
        return alert(`El monto del recibo no alcanza para las aplicaciones (USD ${fmt(totalAplicadoUSD)}).`);
      }
    } else if (form.facturaId) {
      const fac = facturas.find((f) => String(f.id) === String(form.facturaId));
      if (!fac) return alert("La factura seleccionada no existe.");
      const clienteFactura = facturaClienteId(form.facturaId);
      if (clienteFactura) clienteId = +clienteFactura;
      const saldo = saldoFacturaDisponible(form.facturaId);
      if (montoUSD > saldo + 0.01) return alert(`El cobro supera el saldo pendiente de la factura (USD ${fmt(saldo)}).`);
    }

    const {
      notaDifGenerar,
      notaDifMontoUSD,
      notaDifConcepto,
      ...formBase
    } = form;
    const rec = {
      ...formBase,
      clienteId,
      monto,
      tc: +form.tc,
      tcFuente: form.tcFuente || "manual",
      tcFecha: form.tcFecha || null,
      tcId: form.tcId || null,
      facturasAplicadas: aplicaciones,
      facturaId: aplicaciones[0]?.facturaId || String(form.facturaId || ""),
    };
    const prevRec = editId ? recibos.find((r) => String(r.id) === String(editId)) : null;
    const esCheque = isChequeMedio(form.medioPago);
    const fechaEmision = String(form.chequeFechaEmision || form.fecha || today()).slice(0, 10);
    const fechaVencimiento = calcFechaVencCheque({
      fechaEmision,
      plazoDias: form.chequePlazoDias,
      fechaVencimiento: form.chequeFechaVencimiento,
    });
    let nextCheques = cheques;
    let nextCnt = { ...data.cnt };

    if (esCheque) {
      if (!form.chequeNumero || !form.chequeBanco) return alert("Para cheque, completa número y banco.");
      if (!fechaEmision || !fechaVencimiento) return alert("Para cheque, completa fecha de emisión y vencimiento.");
      let chequeId = prevRec?.chequeId || form.chequeId || null;
      const existing = chequeId ? cheques.find((c) => String(c.id) === String(chequeId)) : null;
      if (!chequeId) {
        const nChk = num(nextCnt.chk) + 1;
        chequeId = `CHK_${pad4(nChk)}`;
        nextCnt = { ...nextCnt, chk: nChk };
      }
      const estado = CHEQUE_ESTADOS.includes(form.chequeEstado) ? form.chequeEstado : "en_cartera";
      const chequePayload = {
        ...(existing || {}),
        id: chequeId,
        tipo: chequeTipoFromMedio(form.medioPago),
        numero: String(form.chequeNumero || "").trim(),
        banco: String(form.chequeBanco || "").trim(),
        importe: monto,
        moneda: form.moneda || "PESOS",
        tc: num(form.tc) || 1,
        fechaEmision,
        plazoDias: hasValue(form.chequePlazoDias) ? num(form.chequePlazoDias) : 0,
        fechaVencimiento,
        clienteOrigen: clienteId || null,
        proveedorDestino: null,
        reciboId: editId || null,
        estado,
        fechaEstado: new Date().toISOString(),
        historialEstados: [
          ...(Array.isArray(existing?.historialEstados) ? existing.historialEstados : []),
          {
            fecha: new Date().toISOString(),
            estado,
            usuario: currentUser?.usuario || currentUser?.nombre || "—",
            observacion: editId ? `Actualización desde recibo ${editId}` : "Alta desde recibo",
          },
        ],
      };
      nextCheques = existing
        ? cheques.map((c) => String(c.id) === String(chequeId) ? chequePayload : c)
        : [...cheques, chequePayload];
      rec.chequeId = chequeId;
      rec.chequeNumero = chequePayload.numero;
      rec.chequeBanco = chequePayload.banco;
      rec.chequeFechaEmision = chequePayload.fechaEmision;
      rec.chequePlazoDias = chequePayload.plazoDias;
      rec.chequeFechaVencimiento = chequePayload.fechaVencimiento;
      rec.chequeEstado = chequePayload.estado;
    } else {
      rec.chequeId = null;
      if (prevRec?.chequeId) {
        nextCheques = cheques.map((ch) => String(ch.id) === String(prevRec.chequeId)
          ? {
              ...ch,
              estado: "anulado",
              anulado: true,
              anuladoEl: new Date().toISOString(),
              anuladoPor: currentUser?.usuario || currentUser?.nombre || "—",
              motivoAnulacion: `Recibo ${prevRec.id} cambió a ${form.medioPago}`,
              fechaEstado: new Date().toISOString(),
            }
          : ch);
      }
    }

    let notaDifCambio = null;
    if (editId) {
      rec.id = editId;
      onUpdate("recibos", recibos.map(r => r.id === editId ? rec : r));
    } else {
      const n = data.cnt.rec + 1;
      rec.id = `RC_${pad4(n)}`;
      if (rec.chequeId) {
        nextCheques = nextCheques.map((ch) => String(ch.id) === String(rec.chequeId) ? { ...ch, reciboId: rec.id } : ch);
      }
      const difCambioSugerida = sugerirDifCambioCobro({
        facturaRef: rec.facturaId,
        aplicaciones,
        montoUSD: aplicaciones.length ? totalAplicadoUSD : montoUSD,
        moneda: rec.moneda,
        tcCobro: rec.tc,
        facturas,
        recibos,
        productos,
        cotizaciones,
      });
      let difCambioEstado = difCambioSugerida?.estado || "sin_diferencia";
      if (difCambioSugerida?.estado === "nota_sugerida") {
        if (notaDifGenerar && !clienteId) {
          return alert("Para generar la nota sugerida, el recibo debe tener cliente.");
        }
        if (notaDifGenerar && clienteId) {
          const draft = buildDifCambioNotaDraft({
            sugerencia: difCambioSugerida,
            reciboId: rec.id,
            fecha: rec.fecha,
            clienteId,
            facturaId: String(rec.facturaId || aplicaciones[0]?.facturaId || ""),
            montoUSD: notaDifMontoUSD,
            concepto: notaDifConcepto,
          });
          if (!draft) return alert("No se pudo preparar la nota sugerida. Revisa monto y cliente.");
          const cntKey = draft.key === "notasDebito" ? "nd" : "nc";
          const pref = draft.key === "notasDebito" ? "ND_" : "NC_";
          const nextNota = num(nextCnt[cntKey]) + 1;
          const notaId = `${pref}${pad4(nextNota)}`;
          notaDifCambio = { key: draft.key, nota: { ...draft.nota, id: notaId } };
          nextCnt = { ...nextCnt, [cntKey]: nextNota };
          difCambioEstado = "nota_emitida";
        }
      }
      if (rec.facturaId) {
        rec.diferenciaCambio = {
          ...difCambioSugerida,
          estado: difCambioEstado,
          fechaDeteccion: new Date().toISOString(),
          reciboId: rec.id,
        };
      }
      onUpdate("recibos", [...recibos, rec]);
      nextCnt = { ...nextCnt, rec: n };
    }
    if (notaDifCambio) onUpdate(notaDifCambio.key, [...(notaDifCambio.key === "notasDebito" ? notasDebito : notasCredito), notaDifCambio.nota]);
    if (nextCheques !== cheques) onUpdate("cheques", nextCheques);
    if (JSON.stringify(nextCnt) !== JSON.stringify(data.cnt)) onUpdate("cnt", nextCnt);
    setModal(false);
  };
  const saveCompra = () => {
    const aplicacionesInput = formCompraAplicacionesNormalizadas();
    if (!formCompra.fecha || (!formCompra.monto && !aplicacionesInput.length)) return alert("Completa Fecha y Monto.");
    let monto = num(formCompra.monto);
    let moneda = String(formCompra.moneda || "USD").toUpperCase();
    let tc = num(formCompra.tc) || 1;
    let proveedorId = hasValue(formCompra.proveedorId) ? +formCompra.proveedorId : null;
    const medioPago = String(formCompra.medioPago || "TRANSFERENCIA").toUpperCase();
    const usarSaldoFavor = medioPago === "SALDO_A_FAVOR";
    const prevRec = editCompraId ? recibosCompra.find((r) => String(r.id) === String(editCompraId)) : null;
    let nextCheques = cheques;
    let nextCnt = { ...data.cnt };
    let chequeId = prevRec?.chequeId || formCompra.chequeId || null;
    const nowIso = new Date().toISOString();
    const usuario = currentUser?.usuario || currentUser?.nombre || "-";
    let totalAplicadoUSD = 0;

    const aplicacionesValidadas = [];
    if (aplicacionesInput.length) {
      const proveedoresDetectados = new Set();
      for (const ap of aplicacionesInput) {
        const facturaCompraId = String(ap.facturaCompraId || "");
        const fac = facturasCompra.find((f) => String(f.id) === facturaCompraId && !f.anulado);
        if (!fac) return alert(`La factura ${facturaCompraId} no existe o esta anulada.`);
        const saldo = saldoFacturaCompraDisponible(facturaCompraId);
        if (num(ap.montoUSD) > saldo + 0.01) return alert(`El pago aplicado a ${facturaCompraId} supera su saldo (USD ${fmt(saldo)}).`);
        if (hasValue(fac.proveedorId)) proveedoresDetectados.add(String(fac.proveedorId));
        totalAplicadoUSD += num(ap.montoUSD);
        aplicacionesValidadas.push({
          facturaCompraId,
          compraId: String(fac.compraId || ap.compraId || ""),
          compraBaseId: String(fac.compraBaseId || ap.compraBaseId || ""),
          montoUSD: num(ap.montoUSD),
        });
      }
      if (proveedoresDetectados.size > 1) return alert("Todas las facturas aplicadas deben pertenecer al mismo proveedor.");
      const proveedorApps = proveedoresDetectados.size === 1 ? Number(Array.from(proveedoresDetectados)[0]) : null;
      if (!proveedorId && proveedorApps) proveedorId = proveedorApps;
      if (proveedorId && proveedorApps && String(proveedorId) !== String(proveedorApps)) {
        return alert("El proveedor del recibo no coincide con las facturas aplicadas.");
      }
    }

    if (monto <= 0 && aplicacionesValidadas.length) {
      const totalAppsUSD = aplicacionesValidadas.reduce((s, ap) => s + num(ap.montoUSD), 0);
      monto = usdToMoney(totalAppsUSD, moneda, tc);
    }

    if (medioPago === "CHEQUE_TERCERO") {
      const chequeSelId = String(formCompra.chequeSeleccionadoId || chequeId || "");
      if (!chequeSelId) return alert("Selecciona un cheque de terceros.");
      const chequeSel = cheques.find((x) => String(x.id) === chequeSelId);
      if (!chequeSel) return alert("El cheque seleccionado no existe.");
      if (chequeSel.anulado || String(chequeSel.estado || "") === "anulado") return alert("El cheque seleccionado esta anulado.");
      if (String(chequeSel.tipo || "") !== "terceros") return alert("Solo puedes usar cheques de terceros.");
      if (String(chequeSel.estado || "en_cartera") !== "en_cartera" && String(prevRec?.chequeId || "") !== chequeSelId) {
        return alert("El cheque no esta disponible en cartera.");
      }
      monto = num(chequeSel.importe);
      moneda = String(chequeSel.moneda || moneda).toUpperCase();
      tc = num(chequeSel.tc) || tc;
      chequeId = chequeSelId;
      nextCheques = cheques.map((ch) => String(ch.id) === chequeSelId ? {
        ...ch,
        estado: "entregado_proveedor",
        proveedorDestino: proveedorId,
        compraId: aplicacionesValidadas[0]?.compraId || null,
        reciboCompraId: editCompraId || ch.reciboCompraId || null,
        fechaEstado: nowIso,
        historialEstados: [
          ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
          { fecha: nowIso, estado: "entregado_proveedor", usuario, observacion: editCompraId ? `Actualizado desde recibo compra ${editCompraId}` : "Alta desde recibo de proveedor" },
        ],
      } : ch);
    } else if (medioPago === "CHEQUE_PROPIO" || medioPago === "CHEQUE") {
      if (!formCompra.chequeNumero || !formCompra.chequeBanco) return alert("Completa numero y banco del cheque.");
      const fechaEmision = String(formCompra.chequeFechaEmision || formCompra.fecha || today()).slice(0, 10);
      const fechaVencimiento = calcFechaVencCheque({
        fechaEmision,
        plazoDias: formCompra.chequePlazoDias,
        fechaVencimiento: formCompra.chequeFechaVencimiento,
      });
      if (!fechaEmision || !fechaVencimiento) return alert("Completa fecha de emision y vencimiento del cheque.");
      const existing = chequeId ? cheques.find((c) => String(c.id) === String(chequeId)) : null;
      if (!chequeId || String(existing?.tipo || "") !== "propio") {
        const nChk = num(nextCnt.chk) + 1;
        chequeId = `CHK_${pad4(nChk)}`;
        nextCnt = { ...nextCnt, chk: nChk };
      }
      const estado = CHEQUE_ESTADOS.includes(formCompra.chequeEstado) ? formCompra.chequeEstado : "entregado_proveedor";
      const chequePayload = {
        ...(existing || {}),
        id: chequeId,
        tipo: "propio",
        numero: String(formCompra.chequeNumero || "").trim(),
        banco: String(formCompra.chequeBanco || "").trim(),
        importe: monto,
        moneda,
        tc,
        fechaEmision,
        plazoDias: hasValue(formCompra.chequePlazoDias) ? num(formCompra.chequePlazoDias) : 0,
        fechaVencimiento,
        clienteOrigen: null,
        proveedorDestino: proveedorId,
        compraId: aplicacionesValidadas[0]?.compraId || null,
        reciboCompraId: editCompraId || null,
        estado,
        fechaEstado: nowIso,
        historialEstados: [
          ...(Array.isArray(existing?.historialEstados) ? existing.historialEstados : []),
          {
            fecha: nowIso,
            estado,
            usuario,
            observacion: editCompraId ? `Actualizacion desde recibo compra ${editCompraId}` : "Alta desde recibo de proveedor",
          },
        ],
      };
      nextCheques = existing
        ? cheques.map((c) => String(c.id) === String(chequeId) ? chequePayload : c)
        : [...cheques, chequePayload];
    } else {
      chequeId = null;
      if (prevRec?.chequeId) {
        nextCheques = cheques.map((ch) => {
          if (String(ch.id) !== String(prevRec.chequeId)) return ch;
          if (String(ch.tipo || "") === "terceros") {
            return {
              ...ch,
              estado: "en_cartera",
              proveedorDestino: null,
              compraId: null,
              reciboCompraId: null,
              fechaEstado: nowIso,
              historialEstados: [
                ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
                { fecha: nowIso, estado: "en_cartera", usuario, observacion: `Reversado por cambio de medio en ${prevRec.id}` },
              ],
            };
          }
          return {
            ...ch,
            estado: "anulado",
            anulado: true,
            anuladoEl: nowIso,
            anuladoPor: usuario,
            motivoAnulacion: `Recibo compra ${prevRec.id} cambio a ${medioPago}`,
            fechaEstado: nowIso,
          };
        });
      }
    }

    if (monto <= 0) return alert("El monto debe ser mayor a 0.");
    if (usarSaldoFavor) {
      if (!proveedorId) return alert("Para usar saldo a favor, selecciona un proveedor.");
      const montoUsdFavor = moneyToUSD(monto, moneda, tc);
      monto = montoUsdFavor;
      moneda = "USD";
      tc = 1;
      if (!aplicacionesValidadas.length && !formCompra.facturaCompraId) {
        return alert("El saldo a favor debe aplicarse a una o más facturas de compra.");
      }
    }
    const montoUsd = moneyToUSD(monto, moneda, tc);
    if (aplicacionesValidadas.length && montoUsd + 0.01 < totalAplicadoUSD) {
      return alert(`El monto del recibo no alcanza para las aplicaciones (USD ${fmt(totalAplicadoUSD)}).`);
    }

    let appsFinal = normalizeReciboCompraAplicaciones(aplicacionesValidadas);
    if (!appsFinal.length && formCompra.facturaCompraId) {
      const fid = String(formCompra.facturaCompraId || "");
      const fac = facturasCompra.find((f) => String(f.id) === fid && !f.anulado);
      if (!fac) return alert("La factura seleccionada no existe.");
      const saldo = saldoFacturaCompraDisponible(fid);
      if (montoUsd > saldo + 0.01) return alert(`El pago supera el saldo pendiente de la factura (USD ${fmt(saldo)}).`);
      if (!proveedorId && hasValue(fac.proveedorId)) proveedorId = +fac.proveedorId;
      appsFinal = normalizeReciboCompraAplicaciones([{
        facturaCompraId: fid,
        compraId: String(fac.compraId || ""),
        compraBaseId: String(fac.compraBaseId || ""),
        montoUSD: montoUsd,
      }]);
    }

    if (usarSaldoFavor) {
      const saldoFavorDisponible = saldoFavorProveedorDisponibleUSD({
        proveedorId,
        fechaHasta: formCompra.fecha,
        compras,
        facturasCompra,
        recibosCompra,
        notasDebito,
        notasCredito,
        productos,
        excludeReciboCompraId: editCompraId || null,
      });
      if (montoUsd > saldoFavorDisponible + 0.01) {
        return alert(`Saldo a favor insuficiente. Disponible: USD ${fmt(saldoFavorDisponible)}.`);
      }
    }

    const compraRef = appsFinal[0] || null;
    const rec = {
      ...formCompra,
      proveedorId,
      facturaCompraId: appsFinal[0]?.facturaCompraId || String(formCompra.facturaCompraId || ""),
      facturasCompraAplicadas: appsFinal,
      compraId: compraRef?.compraId || formCompra.compraId || null,
      compraBaseId: compraRef?.compraBaseId || formCompra.compraBaseId || "",
      monto,
      moneda,
      tc,
      medioPago,
      chequeId: chequeId || null,
      numeroRecibo: formCompra.numeroRecibo || "",
      impactaCuenta: !usarSaldoFavor,
    };

    if (editCompraId) {
      rec.id = editCompraId;
      rec.numeroRecibo = rec.numeroRecibo || editCompraId;
      onUpdate("recibosCompra", recibosCompra.map((r) => String(r.id) === String(editCompraId) ? rec : r));
    } else {
      const n = num(data.cnt.rcp) + 1;
      rec.id = `RCP_${pad4(n)}`;
      rec.numeroRecibo = rec.numeroRecibo || rec.id;
      onUpdate("recibosCompra", [...recibosCompra, rec]);
      nextCnt = { ...nextCnt, rcp: n };
    }
    if (rec.chequeId) {
      nextCheques = nextCheques.map((ch) => String(ch.id) === String(rec.chequeId) ? {
        ...ch,
        proveedorDestino: rec.proveedorId || ch.proveedorDestino || null,
        compraId: rec.compraId || ch.compraId || null,
        reciboCompraId: rec.id,
      } : ch);
    }
    if (nextCheques !== cheques) onUpdate("cheques", nextCheques);
    if (JSON.stringify(nextCnt) !== JSON.stringify(data.cnt)) onUpdate("cnt", nextCnt);
    setModalCompra(false);
  };
  const handleAnularReciboCompra = (r) => {
    setAnularRecCompra(r);
  };
  const handleDeleteReciboCompra = (r) => {
    if (!canDelete) return;
    if (!confirm(`¿Eliminar definitivamente el recibo ${r.id}?`)) return;
    onUpdate("recibosCompra", recibosCompra.filter((x) => String(x.id) !== String(r.id)));
  };
  const montoUSD = moneyToUSD(form.monto, form.moneda, form.tc);
  const aplicacionesForm = formAplicacionesNormalizadas();
  const aplicacionesSet = new Set(aplicacionesForm.map((ap) => String(ap.facturaId)));
  const totalAplicadoUSD = hasValue(form?.aplicadoUSD)
    ? num(form.aplicadoUSD)
    : aplicacionesForm.reduce((s, ap) => s + num(ap.montoUSD), 0);
  const totalAplicadoMoneda = usdToMoney(totalAplicadoUSD, form.moneda, form.tc);
  const difCambioPreview = sugerirDifCambioCobro({
    facturaRef: form.facturaId,
    aplicaciones: aplicacionesForm,
    montoUSD: aplicacionesForm.length ? totalAplicadoUSD : montoUSD,
    moneda: form.moneda,
    tcCobro: form.tc,
    facturas,
    recibos: recibosBase,
    productos,
    cotizaciones,
  });
  const facturasPendientes = facturas
    .filter((f) => !f.anulado)
    .filter((f) => {
      const cli = facturaClienteId(f.id);
      if (form.clienteId && +cli !== +form.clienteId && !aplicacionesSet.has(String(f.id))) return false;
      const saldo = saldoFacturaDisponible(f.id);
      return saldo > 0.01 || aplicacionesSet.has(String(f.id));
    })
    .map((f) => ({
      factura: f,
      saldo: saldoFacturaDisponible(f.id),
      aplicado: num(aplicacionesForm.find((ap) => String(ap.facturaId) === String(f.id))?.montoUSD),
      clienteId: facturaClienteId(f.id),
    }))
    .sort((a, b) => String(a.factura.id).localeCompare(String(b.factura.id)));
  const esChequeForm = isChequeMedio(form.medioPago);
  const montoUSDCompra = moneyToUSD(formCompra.monto, formCompra.moneda, formCompra.tc);
  const aplicacionesCompraForm = formCompraAplicacionesNormalizadas();
  const aplicacionesCompraSet = new Set(aplicacionesCompraForm.map((ap) => String(ap.facturaCompraId)));
  const totalAplicadoUSDCompra = hasValue(formCompra?.aplicadoUSD)
    ? num(formCompra.aplicadoUSD)
    : aplicacionesCompraForm.reduce((s, ap) => s + num(ap.montoUSD), 0);
  const totalAplicadoMonedaCompra = usdToMoney(totalAplicadoUSDCompra, formCompra.moneda, formCompra.tc);
  const facturasCompraPendientes = facturasCompra
    .filter((f) => !f.anulado)
    .filter((f) => {
      if (formCompra.proveedorId && +f.proveedorId !== +formCompra.proveedorId && !aplicacionesCompraSet.has(String(f.id))) return false;
      const saldo = saldoFacturaCompraDisponible(f.id);
      return saldo > 0.01 || aplicacionesCompraSet.has(String(f.id));
    })
    .map((f) => ({
      factura: f,
      saldo: saldoFacturaCompraDisponible(f.id),
      aplicado: num(aplicacionesCompraForm.find((ap) => String(ap.facturaCompraId) === String(f.id))?.montoUSD),
      proveedorId: f.proveedorId,
    }))
    .sort((a, b) => String(a.factura.id).localeCompare(String(b.factura.id)));
  const medioPagoCompra = String(formCompra.medioPago || "").toUpperCase();
  const usaSaldoFavorCompra = medioPagoCompra === "SALDO_A_FAVOR";
  const esChequeFormCompra = isChequeMedio(formCompra.medioPago);
  const esChequeTerceroCompra = medioPagoCompra === "CHEQUE_TERCERO";
  const esChequePropioCompra = medioPagoCompra === "CHEQUE_PROPIO" || medioPagoCompra === "CHEQUE";
  const saldoFavorDisponibleCompra = saldoFavorProveedorDisponibleUSD({
    proveedorId: formCompra.proveedorId,
    fechaHasta: formCompra.fecha || today(),
    compras,
    facturasCompra,
    recibosCompra,
    notasDebito,
    notasCredito,
    productos,
    excludeReciboCompraId: editCompraId || null,
  });
  const chequeCompraActualId = String(formCompra.chequeSeleccionadoId || formCompra.chequeId || "");
  const chequesTercerosDisponiblesCompra = cheques
    .filter((ch) => String(ch.tipo || "") === "terceros")
    .filter((ch) => !ch.anulado)
    .filter((ch) => {
      const id = String(ch.id || "");
      if (id && id === chequeCompraActualId) return true;
      return String(ch.estado || "en_cartera") === "en_cartera";
    })
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")));
  const filteredRecibos = recibos.filter((r) => inDateRange(r.fecha, dateRange) && (showAnulados || !r.anulado));
  const filteredRecibosCompra = recibosCompra.filter((r) => inDateRange(r.fecha, dateRange) && (showAnulados || !r.anulado));
  const isEmitidosRec = origenFilter === "emitidas";
  const countRec = isEmitidosRec ? filteredRecibos.length : filteredRecibosCompra.length;
  const totalRec = isEmitidosRec ? recibos.length : recibosCompra.length;
  return (
    <div>
      <PageHdr
        title={isEmitidosRec ? "Recibos de Cobro" : "Recibos de Compra"}
        sub={isEmitidosRec ? "Pagos recibidos de clientes" : "Pagos emitidos a proveedores"}
        onNew={isEmitidosRec ? openNew : openNewCompra}
        btn={isEmitidosRec ? "+ Nuevo Recibo" : "+ Registrar Recibo Proveedor"}
      />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <DateRangeFilter range={dateRange} onChange={setDateRange} count={countRec} total={totalRec} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Origen:</span>
          <button
            type="button"
            onClick={() => setOrigenFilter("emitidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isEmitidosRec
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Emitidos
          </button>
          <button
            type="button"
            onClick={() => setOrigenFilter("recibidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              !isEmitidosRec
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Recibidos
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
      </div>
      {isEmitidosRec ? (
        <Card>
          <table className="w-full text-sm">
            <THead cols={["ID","Fecha","Cliente","Operacion","Factura/s","Concepto","Monto","Moneda","T/C","USD equiv.","Medio Pago",""]} />
            <tbody>
              {filteredRecibos.map(r => {
                const usd = reciboUSD(r);
                const an = r.anulado;
                const apps = normalizeReciboAplicaciones(r.facturasAplicadas);
                const facturaIdsBase = apps.length
                  ? apps.map((ap) => String(ap.facturaId || ""))
                  : (r.facturaId ? [String(r.facturaId)] : []);
                const opIds = Array.from(new Set(
                  facturaIdsBase
                    .map((fid) => facturas.find((f) => String(f.id) === String(fid))?.opId)
                    .filter(Boolean),
                ));
                const opLinkId = opIds[0] || "";
                const opLabel = opIds.length <= 1 ? (opIds[0] || "-") : `${opIds[0]} +${opIds.length - 1}`;
                const facturaLabel = apps.length
                  ? apps.map((ap) => `${ap.facturaId} (USD ${fmt(ap.montoUSD)})`).join(" · ")
                  : (r.facturaId || "-");
                return (
                  <TR key={r.id} className={an ? "opacity-50 line-through" : ""}>
                    <TD mono><span className="text-emerald-700 font-bold">{r.id}</span></TD>
                    <TD>{fmtD(r.fecha)}</TD>
                    <TD bold>{lookupNombre(clientes, r.clienteId)}</TD>
                    <TD mono gray>
                      {opLinkId && onNavigate ? (
                        <button
                          type="button"
                          onClick={() => onNavigate("operaciones", opLinkId)}
                          className="underline decoration-dotted underline-offset-2 hover:text-slate-700"
                          title="Ir a operación"
                        >
                          {opLabel}
                        </button>
                      ) : opLabel}
                    </TD>
                    <TD mono gray nowrap={false}>{facturaLabel}</TD>
                    <TD gray>{r.concepto || "-"}</TD>
                    <TD right bold>{fmt(r.monto, 0)}</TD>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.moneda === "DOLAR" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{r.moneda}</span></td>
                    <TD right gray>{fmt(r.tc, 0)}</TD>
                    <TD right green>USD {fmt(usd)}</TD>
                    <TD gray>{medioPagoLabel(r.medioPago)}</TD>
                    <Btns anulado={an} onEdit={() => openEdit(r)} onAnular={() => setAnularRec(r)} onPdf={() => descargarReciboPDF(r, data)} />
                  </TR>
                );
              })}
              {!filteredRecibos.length && <EmptyRow cols={12} />}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <THead cols={["ID","Fecha","Proveedor","Factura/s","Concepto","Monto","Moneda","T/C","USD equiv.","Medio Pago",""]} />
            <tbody>
              {filteredRecibosCompra.map((r) => {
                const usd = reciboCompraUSD(r);
                const an = r.anulado;
                const apps = normalizeReciboCompraAplicaciones(r.facturasCompraAplicadas);
                const facturaLabel = apps.length
                  ? apps.map((ap) => `${ap.facturaCompraId} (USD ${fmt(ap.montoUSD)})`).join(" · ")
                  : (r.facturaCompraId || "-");
                return (
                  <TR key={r.id} className={an ? "opacity-50 line-through" : ""}>
                    <TD mono><span className="text-blue-700 font-bold">{r.numeroRecibo || r.id}</span></TD>
                    <TD>{fmtD(r.fecha)}</TD>
                    <TD bold>{lookupNombre(proveedores, r.proveedorId)}</TD>
                    <TD mono gray nowrap={false}>{facturaLabel}</TD>
                    <TD gray>{r.concepto || "-"}</TD>
                    <TD right bold>{fmt(r.monto, 0)}</TD>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${String(r.moneda || "").toUpperCase() === "USD" || String(r.moneda || "").toUpperCase() === "DOLAR" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{r.moneda}</span></td>
                    <TD right gray>{fmt(r.tc, 0)}</TD>
                    <TD right green>USD {fmt(usd)}</TD>
                    <TD gray>{medioPagoLabel(r.medioPago)}</TD>
                    <Btns
                      anulado={an}
                      onEdit={() => openEditCompra(r)}
                      onAnular={() => handleAnularReciboCompra(r)}
                      onDel={() => handleDeleteReciboCompra(r)}
                      showDeleteWithAnular
                    />
                  </TR>
                );
              })}
              {!filteredRecibosCompra.length && <EmptyRow cols={11} />}
            </tbody>
          </table>
        </Card>
      )}
      {modal && (
        <Modal title={editId ? "Editar Recibo" : "Nuevo Recibo"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            <Fl label="Cliente (opcional)"><SelCliente val={form.clienteId} onChange={e => sf("clienteId", e.target.value)} clientes={clientes} /></Fl>
            <Fl label="Facturas a aplicar" span2>
              <div className="border border-[#D6E3DB] rounded-xl bg-white">
                {facturasPendientes.length ? (
                  <div className="max-h-56 overflow-auto divide-y divide-[#EEF3EF]">
                    {facturasPendientes.map(({ factura, saldo, aplicado, clienteId }) => {
                      const selected = aplicacionesSet.has(String(factura.id));
                      const excedido = selected && aplicado > saldo + 0.01;
                      return (
                        <div key={factura.id} className="px-3 py-2.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="accent-emerald-700"
                                checked={selected}
                                onChange={() => toggleAplicacionFactura(factura.id)}
                              />
                              <span className="font-mono text-xs text-[#17211B]">{factura.id}</span>
                            </label>
                            <span className="text-xs text-[#6B7280]">{lookupNombre(clientes, clienteId)}</span>
                            <span className="text-xs text-blue-700 font-semibold">Saldo USD {fmt(saldo)}</span>
                          </div>
                          {selected && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-[#6B7280]">Aplicar USD</span>
                              <input
                                type="number"
                                step="0.01"
                                className={`${IC} max-w-[180px]`}
                                value={aplicado || ""}
                                onChange={(e) => updateAplicacionMonto(factura.id, e.target.value)}
                              />
                              {excedido && <span className="text-xs text-red-600 font-semibold">Excede saldo</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-sm text-[#6B7280]">No hay facturas pendientes para aplicar.</div>
                )}
              </div>
            </Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={form.medioPago || "EFECTIVO"} onChange={e => sf("medioPago", e.target.value)}>
                {MEDIOS_PAGO_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Fl>
            {esChequeForm && (
              <>
                <Fl label="Nº Cheque *"><input type="text" className={IC} value={form.chequeNumero || ""} onChange={e => sf("chequeNumero", e.target.value)} /></Fl>
                <Fl label="Banco *"><input type="text" className={IC} value={form.chequeBanco || ""} onChange={e => sf("chequeBanco", e.target.value)} /></Fl>
                <Fl label="Fecha Emisión *"><input type="date" className={IC} value={form.chequeFechaEmision || ""} onChange={e => sf("chequeFechaEmision", e.target.value)} /></Fl>
                <Fl label="Plazo (días)">
                  <select className={IC} value={hasValue(form.chequePlazoDias) ? form.chequePlazoDias : 0} onChange={e => sf("chequePlazoDias", e.target.value)}>
                    {[0, 30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Fl>
                <Fl label="Fecha Vencimiento (exacta)">
                  <input type="date" className={IC} value={form.chequeFechaVencimiento || ""} onChange={e => sf("chequeFechaVencimiento", e.target.value)} />
                </Fl>
                <Fl label="Estado cheque">
                  <select className={IC} value={form.chequeEstado || "en_cartera"} onChange={e => sf("chequeEstado", e.target.value)}>
                    {CHEQUE_ESTADOS.map((st) => <option key={st} value={st}>{chequeEstadoLabel(st)}</option>)}
                  </select>
                </Fl>
              </>
            )}
            <Fl label="Moneda">
              <select className={IC} value={form.moneda || "PESOS"} onChange={e => {
                const nextMoneda = e.target.value;
                setForm((prev) => {
                  const apps = normalizeReciboAplicaciones(prev.facturasAplicadas);
                  const totalAppsUSD = apps.reduce((s, ap) => s + num(ap.montoUSD), 0);
                  const nextMonto = apps.length ? Number(usdToMoney(totalAppsUSD, nextMoneda, prev.tc).toFixed(2)) : prev.monto;
                  return {
                    ...prev,
                    moneda: nextMoneda,
                    monto: nextMonto,
                    notaDifPreparada: false,
                    notaDifGenerar: false,
                    notaDifMontoUSD: "",
                    notaDifConcepto: "",
                  };
                });
              }}>
                <option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option>
              </select>
            </Fl>
            <Fl label={`Tipo de Cambio${form.tcFuente ? ` (${form.tcFuente})` : ""}`}>
              <input type="number" step="0.01" className={IC}
                value={form.tc || ""}
                onChange={e => {
                  const nextTc = e.target.value;
                  setForm((prev) => {
                    const apps = normalizeReciboAplicaciones(prev.facturasAplicadas);
                    const totalAppsUSD = apps.reduce((s, ap) => s + num(ap.montoUSD), 0);
                    const nextMonto = apps.length ? Number(usdToMoney(totalAppsUSD, prev.moneda, nextTc).toFixed(2)) : prev.monto;
                    return {
                      ...prev,
                      tc: nextTc,
                      tcFuente: "manual",
                      monto: nextMonto,
                      notaDifPreparada: false,
                      notaDifGenerar: false,
                      notaDifMontoUSD: "",
                      notaDifConcepto: "",
                    };
                  });
                }}
                onFocus={() => { if (form.tcFuente && form.tcFuente !== "manual") sf("tcFuente", "manual"); }} />
            </Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={`${IC} no-spin`} value={form.monto || ""} onWheel={e => e.currentTarget.blur()} onChange={e => setForm((prev) => ({ ...prev, monto: e.target.value, notaDifPreparada: false, notaDifGenerar: false, notaDifMontoUSD: "", notaDifConcepto: "" }))} /></Fl>
            <Fl label="Concepto"><input type="text" className={IC} value={form.concepto || ""} onChange={e => sf("concepto", e.target.value)} /></Fl>
          </div>
          {aplicacionesForm.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 flex items-center justify-between gap-3">
              <span>Total aplicado en facturas:</span>
              <span className="font-bold">
                USD {fmt(totalAplicadoUSD)}
                {(String(form.moneda || "").toUpperCase() !== "USD" && String(form.moneda || "").toUpperCase() !== "DOLAR") && (
                  <span className="ml-2 text-blue-500 font-normal">≈ {monedaLabel(form.moneda)} {fmt(totalAplicadoMoneda)}</span>
                )}
              </span>
            </div>
          )}
          {num(form.monto) > 0 && (String(form.moneda || "").toUpperCase() !== "USD" && String(form.moneda || "").toUpperCase() !== "DOLAR") && (
            <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between text-sm">
              <span className="text-gray-500">Equivalente USD del monto:</span>
              <span className={`font-bold text-lg ${montoUSD + 0.01 < totalAplicadoUSD ? "text-red-700" : "text-emerald-700"}`}>USD {fmt(montoUSD)}</span>
            </div>
          )}
          {difCambioPreview?.estado === "nota_sugerida" && (
            <div className={`mt-2 rounded-xl p-3 text-sm border ${
              difCambioPreview.tipoNota === "ND"
                ? "bg-orange-50 border-orange-100 text-orange-800"
                : "bg-sky-50 border-sky-100 text-sky-800"
            }`}>
              <div className="font-semibold">
                Diferencia de cambio detectada: sugerir Nota de {difCambioPreview.tipoNota === "ND" ? "Débito" : "Crédito"}
              </div>
              <div className="mt-1">
                Monto sugerido: <strong>USD {fmt(difCambioPreview.montoNotaUSD)}</strong> (ARS {fmt(difCambioPreview.montoNotaArs)}).
              </div>
              <div className="text-xs mt-1">
                TC factura promedio {fmt(difCambioPreview.tcOriginalPromedio, 2)} vs TC cobro {fmt(difCambioPreview.tcCobro, 2)}.
              </div>
              {!form.notaDifPreparada ? (
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 rounded-lg border border-current text-xs font-semibold hover:bg-white/50"
                  onClick={() => {
                    const facRef = String(form.facturaId || aplicacionesForm[0]?.facturaId || "");
                    const clienteSug = hasValue(form.clienteId) ? +form.clienteId : (facRef ? facturaClienteId(facRef) : null);
                    const draft = buildDifCambioNotaDraft({
                      sugerencia: difCambioPreview,
                      reciboId: "(pendiente)",
                      fecha: form.fecha,
                      clienteId: clienteSug,
                      facturaId: facRef,
                    });
                    if (!draft) return alert("No se pudo preparar la nota. Verifica cliente y factura.");
                    setForm((prev) => ({
                      ...prev,
                      notaDifPreparada: true,
                      notaDifGenerar: false,
                      notaDifMontoUSD: Number(num(draft.nota.monto).toFixed(2)),
                      notaDifConcepto: draft.nota.concepto,
                    }));
                  }}
                >
                  Hacer Nota {difCambioPreview.tipoNota === "ND" ? "de Débito" : "de Crédito"} sugerida
                </button>
              ) : (
                <div className="mt-3 rounded-lg border border-current/30 bg-white/50 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="text-xs">
                      <span className="block mb-1 font-semibold">Monto nota (USD)</span>
                      <input
                        type="number"
                        step="0.01"
                        className={IC}
                        value={form.notaDifMontoUSD || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, notaDifMontoUSD: e.target.value, notaDifGenerar: false }))}
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      <span className="block mb-1 font-semibold">Concepto</span>
                      <input
                        type="text"
                        className={IC}
                        value={form.notaDifConcepto || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, notaDifConcepto: e.target.value, notaDifGenerar: false }))}
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        form.notaDifGenerar
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white border-[#D6E3DB] text-[#17211B] hover:border-emerald-300"
                      }`}
                      onClick={() => setForm((prev) => ({ ...prev, notaDifGenerar: true }))}
                    >
                      Generar Nota {difCambioPreview.tipoNota === "ND" ? "de Débito" : "de Crédito"}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white border-[#D6E3DB] text-[#17211B] hover:border-gray-400"
                      onClick={() => setForm((prev) => ({
                        ...prev,
                        notaDifPreparada: false,
                        notaDifGenerar: false,
                        notaDifMontoUSD: "",
                        notaDifConcepto: "",
                      }))}
                    >
                      Quitar sugerencia
                    </button>
                    {form.notaDifGenerar && <span className="text-xs font-semibold text-emerald-700">Se emitirá al registrar el recibo.</span>}
                  </div>
                </div>
              )}
            </div>
          )}
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
      {modalCompra && (
        <Modal title={editCompraId ? "Editar Recibo Proveedor" : "Registrar Recibo Proveedor"} wide onClose={() => setModalCompra(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={formCompra.fecha || ""} onChange={e => sfCompra("fecha", e.target.value)} /></Fl>
            <Fl label="Proveedor (opcional)">
              <SearchSelect
                value={formCompra.proveedorId || ""}
                placeholder="Seleccionar proveedor..."
                options={proveedores.map((p) => ({
                  value: String(p.id),
                  label: p.nombre,
                  searchText: `${p.nombre} ${p.cuit || ""}`,
                }))}
                onChange={(next) => sfCompra("proveedorId", String(next || ""))}
                clearable
                clearLabel="Sin proveedor"
                emptyLabel="Sin proveedores"
              />
            </Fl>
            <Fl label="Facturas a aplicar" span2>
              <div className="border border-[#D6E3DB] rounded-xl bg-white">
                {facturasCompraPendientes.length ? (
                  <div className="max-h-56 overflow-auto divide-y divide-[#EEF3EF]">
                    {facturasCompraPendientes.map(({ factura, saldo, aplicado, proveedorId }) => {
                      const selected = aplicacionesCompraSet.has(String(factura.id));
                      const excedido = selected && aplicado > saldo + 0.01;
                      return (
                        <div key={factura.id} className="px-3 py-2.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="accent-emerald-700"
                                checked={selected}
                                onChange={() => toggleAplicacionFacturaCompra(factura.id)}
                              />
                              <span className="font-mono text-xs text-[#17211B]">{factura.id}</span>
                            </label>
                            <span className="text-xs text-[#6B7280]">{lookupNombre(proveedores, proveedorId)}</span>
                            <span className="text-xs text-blue-700 font-semibold">Saldo USD {fmt(saldo)}</span>
                          </div>
                          {selected && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-[#6B7280]">Aplicar USD</span>
                              <input
                                type="number"
                                step="0.01"
                                className={`${IC} max-w-[180px]`}
                                value={aplicado || ""}
                                onChange={(e) => updateAplicacionMontoCompra(factura.id, e.target.value)}
                              />
                              {excedido && <span className="text-xs text-red-600 font-semibold">Excede saldo</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-sm text-[#6B7280]">No hay facturas de compra pendientes para aplicar.</div>
                )}
              </div>
            </Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={formCompra.medioPago || "TRANSFERENCIA"} onChange={e => {
                const nextMedio = String(e.target.value || "").toUpperCase();
                if (nextMedio === "SALDO_A_FAVOR") {
                  const totalApps = normalizeReciboCompraAplicaciones(formCompra.facturasCompraAplicadas).reduce((s, ap) => s + num(ap.montoUSD), 0);
                  const sugerido = totalApps > 0 ? Math.min(totalApps, saldoFavorDisponibleCompra) : Math.min(num(formCompra.monto) || 0, saldoFavorDisponibleCompra);
                  setFormCompra((prev) => ({
                    ...prev,
                    medioPago: nextMedio,
                    moneda: "USD",
                    tc: 1,
                    monto: Number(Math.max(0, sugerido).toFixed(2)),
                  }));
                  return;
                }
                sfCompra("medioPago", nextMedio);
              }}>
                {MEDIOS_PAGO_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Fl>
            {usaSaldoFavorCompra && (
              <Fl label="Saldo a favor disponible">
                <div className="h-[42px] rounded-xl border border-emerald-200 bg-emerald-50 px-3 flex items-center text-emerald-700 font-semibold">
                  USD {fmt(saldoFavorDisponibleCompra)}
                </div>
              </Fl>
            )}
            {esChequeTerceroCompra && (
              <Fl label="Cheque de terceros *" span2>
                <SearchSelect
                  value={formCompra.chequeSeleccionadoId || ""}
                  placeholder="Seleccionar cheque en cartera..."
                  options={chequesTercerosDisponiblesCompra.map((ch) => ({
                    value: String(ch.id),
                    label: `${ch.id} - ${ch.banco || "Sin banco"} - ${ch.moneda} ${fmt(ch.importe, 0)} - vence ${fmtD(ch.fechaVencimiento)}`,
                    searchText: `${ch.id} ${ch.numero || ""} ${ch.banco || ""}`,
                  }))}
                  clearable
                  clearLabel="Sin seleccionar"
                  emptyLabel="No hay cheques de terceros disponibles"
                  onChange={(chequeId) => {
                    const nextId = String(chequeId || "");
                    const ch = cheques.find((x) => String(x.id) === nextId) || null;
                    if (!ch) {
                      setFormCompra((prev) => ({ ...prev, chequeSeleccionadoId: "", chequeId: null }));
                      return;
                    }
                    setFormCompra((prev) => ({
                      ...prev,
                      chequeSeleccionadoId: nextId,
                      chequeId: nextId,
                      monto: num(ch.importe) || 0,
                      moneda: String(ch.moneda || prev.moneda || "USD").toUpperCase(),
                      tc: num(ch.tc) || num(prev.tc) || 1,
                    }));
                  }}
                />
              </Fl>
            )}
            {esChequePropioCompra && (
              <>
                <Fl label="N° Cheque *"><input type="text" className={IC} value={formCompra.chequeNumero || ""} onChange={e => sfCompra("chequeNumero", e.target.value)} /></Fl>
                <Fl label="Banco *"><input type="text" className={IC} value={formCompra.chequeBanco || ""} onChange={e => sfCompra("chequeBanco", e.target.value)} /></Fl>
                <Fl label="Fecha Emision *"><input type="date" className={IC} value={formCompra.chequeFechaEmision || ""} onChange={e => sfCompra("chequeFechaEmision", e.target.value)} /></Fl>
                <Fl label="Plazo (dias)">
                  <select className={IC} value={hasValue(formCompra.chequePlazoDias) ? formCompra.chequePlazoDias : 0} onChange={e => sfCompra("chequePlazoDias", e.target.value)}>
                    {[0, 30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Fl>
                <Fl label="Fecha Vencimiento (exacta)">
                  <input type="date" className={IC} value={formCompra.chequeFechaVencimiento || ""} onChange={e => sfCompra("chequeFechaVencimiento", e.target.value)} />
                </Fl>
                <Fl label="Estado cheque">
                  <select className={IC} value={formCompra.chequeEstado || "entregado_proveedor"} onChange={e => sfCompra("chequeEstado", e.target.value)}>
                    {CHEQUE_ESTADOS.map((st) => <option key={st} value={st}>{chequeEstadoLabel(st)}</option>)}
                  </select>
                </Fl>
              </>
            )}
            <Fl label="Moneda">
              <select className={IC} disabled={usaSaldoFavorCompra} value={formCompra.moneda || "USD"} onChange={e => {
                const nextMoneda = e.target.value;
                setFormCompra((prev) => {
                  const apps = normalizeReciboCompraAplicaciones(prev.facturasCompraAplicadas);
                  const totalAppsUSD = apps.reduce((s, ap) => s + num(ap.montoUSD), 0);
                  const nextMonto = apps.length ? Number(usdToMoney(totalAppsUSD, nextMoneda, prev.tc).toFixed(2)) : prev.monto;
                  return { ...prev, moneda: nextMoneda, monto: nextMonto };
                });
              }}>
                <option value="USD">USD</option>
                <option value="PESOS">PESOS</option>
              </select>
            </Fl>
            <Fl label={`Tipo de Cambio${formCompra.tcFuente ? ` (${formCompra.tcFuente})` : ""}`}>
              <input
                type="number"
                step="0.01"
                className={IC}
                disabled={usaSaldoFavorCompra}
                value={formCompra.tc || ""}
                onChange={e => {
                  const nextTc = e.target.value;
                  setFormCompra((prev) => {
                    const apps = normalizeReciboCompraAplicaciones(prev.facturasCompraAplicadas);
                    const totalAppsUSD = apps.reduce((s, ap) => s + num(ap.montoUSD), 0);
                    const nextMonto = apps.length ? Number(usdToMoney(totalAppsUSD, prev.moneda, nextTc).toFixed(2)) : prev.monto;
                    return { ...prev, tc: nextTc, tcFuente: "manual", monto: nextMonto };
                  });
                }}
                onFocus={() => { if (formCompra.tcFuente && formCompra.tcFuente !== "manual") sfCompra("tcFuente", "manual"); }}
              />
            </Fl>
            <Fl label="Monto *">
              <input
                type="number"
                step="0.01"
                className={`${IC} no-spin`}
                value={formCompra.monto || ""}
                disabled={esChequeTerceroCompra}
                onWheel={e => e.currentTarget.blur()}
                onChange={e => sfCompra("monto", e.target.value)}
              />
            </Fl>
            <Fl label="Concepto"><input type="text" className={IC} value={formCompra.concepto || ""} onChange={e => sfCompra("concepto", e.target.value)} /></Fl>
          </div>
          {aplicacionesCompraForm.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 flex items-center justify-between gap-3">
              <span>Total aplicado en facturas:</span>
              <span className="font-bold">
                USD {fmt(totalAplicadoUSDCompra)}
                {(String(formCompra.moneda || "").toUpperCase() !== "USD") && (
                  <span className="ml-2 text-blue-500 font-normal">≈ {monedaLabel(formCompra.moneda)} {fmt(totalAplicadoMonedaCompra)}</span>
                )}
              </span>
            </div>
          )}
          {num(formCompra.monto) > 0 && (String(formCompra.moneda || "").toUpperCase() !== "USD") && (
            <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between text-sm">
              <span className="text-gray-500">Equivalente USD del monto:</span>
              <span className={`font-bold text-lg ${montoUSDCompra + 0.01 < totalAplicadoUSDCompra ? "text-red-700" : "text-emerald-700"}`}>USD {fmt(montoUSDCompra)}</span>
            </div>
          )}
          <FBtns onSave={saveCompra} onCancel={() => setModalCompra(false)} saveLabel="Registrar Recibo Proveedor" />
        </Modal>
      )}
      {anularRec && (
        <AnularModal
          entityLabel="Recibo"
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
      {anularRecCompra && (
        <AnularModal
          entityLabel="Recibo de compra"
          record={anularRecCompra}
          onClose={() => setAnularRecCompra(null)}
          onConfirm={handleAnularCompra}
        />
      )}
    </div>
  );
}

// ─── COMPRAS ──────────────────────────────────────────────────────────────────
function Compras({ data, onUpdate, navTarget, currentUser }) {
  const canDelete = useCanDelete();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [compraItems, setCompraItems] = useState([{ productoId: "", cantidad: "", precio: "", ivaPct: "" }]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [anularRec, setAnularRec] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
  const [compraFilter, setCompraFilter] = useState("all");
  const [qRem, setQRem] = useState(null);
  const [qFac, setQFac] = useState(null);
  const [qRec, setQRec] = useState(null);
  const [qRemGroup, setQRemGroup] = useState(null);
  const [qFacGroup, setQFacGroup] = useState(null);
  const [expandId, setExpandId] = useState(null);
  const rowRefs = useRef({});
  const precioRefs = useRef([]);
  const cantidadRefs = useRef([]);
  const {
    compras,
    proveedores,
    productos,
    cotizaciones,
    notasDebito = [],
    notasCredito = [],
    cheques = [],
    remitosCompra = [],
    facturasCompra = [],
    recibosCompra = [],
  } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCompraItem = (idx, key, value) => setCompraItems((items) => items.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  const focusProductoRow = (idx) => {
    setTimeout(() => {
      const el = document.querySelector(`.compra-prod-sel-${idx} input`);
      if (!el) return;
      el.focus();
      if (typeof el.select === "function") el.select();
    }, 0);
  };
  const addCompraItem = ({ focus = false } = {}) => setCompraItems((items) => {
    const next = [...items, { productoId: "", cantidad: "", precio: "", ivaPct: "" }];
    if (focus) focusProductoRow(next.length - 1);
    return next;
  });
  const delCompraItem = (idx) => setCompraItems((items) => items.length <= 1 ? items : items.filter((_, i) => i !== idx));
  const remitosActivos = filterActive(remitosCompra);
  const facturasActivas = filterActive(facturasCompra);
  const recibosActivos = filterActive(recibosCompra);
  const pagosByFacturaCompra = buildPagosByFacturaCompra(recibosActivos);
  const saldoFacturaCompraUSD = (facturaId) => {
    const f = facturasActivas.find((x) => String(x.id) === String(facturaId));
    if (!f) return 0;
    const total = facCompraTotalUSD(f, productos);
    const pagado = num(pagosByFacturaCompra.get(String(f.id)));
    return Math.max(0, total - pagado);
  };
  const calcCompraTracks = (c) => {
    const comprometido = num(c?.cantidad);
    const remitado = remitosActivos
      .filter((r) => String(r.compraId || "") === String(c.id))
      .reduce((s, r) => s + num(r.cantidad), 0);
    const facturasLinea = facturasActivas.filter((f) => String(f.compraId || "") === String(c.id));
    const facturado = facturasLinea.reduce((s, f) => s + num(f.cantidad), 0);
    // Usar subtotal neto (sin IVA) para que sea consistente con compraTotalUSD que tampoco incluye IVA
    const facCompraNetUSD = (f) => {
      const sub = num(f?.cantidad) * num(f?.precioUnit);
      const moneda = String(f?.moneda || "USD").toUpperCase();
      if (moneda === "PESOS" || moneda === "ARS") return sub / (num(f?.tc) || 1);
      return sub;
    };
    const totalFacturadoNET = facturasLinea.reduce((s, f) => s + facCompraNetUSD(f), 0);
    const pagadoDocsUSD = recibosActivos
      .filter((r) => String(r.compraId || "") === String(c.id))
      .reduce((s, r) => s + reciboCompraUSD(r), 0);
    const totalUSD = totalFacturadoNET > 0.0001 ? totalFacturadoNET : compraTotalUSD(c);
    const pagadoUSD = pagadoDocsUSD > 0.0001 ? pagadoDocsUSD : compraPagadoUSD(c);
    const pendEntrega = Math.max(0, comprometido - remitado);
    const pendFacturar = Math.max(0, comprometido - facturado);
    const pendCobrar = Math.max(0, totalUSD - pagadoUSD);
    return {
      comprometido,
      remitado,
      facturado,
      cobradoUSD: pagadoUSD,
      totalFacturadoUSD: Math.max(totalUSD, 0.01),
      pendEntrega,
      pendFacturar,
      pendCobrar,
      done: pendEntrega <= 0.01 && pendFacturar <= 0.01 && Math.abs(totalUSD - pagadoUSD) <= 0.01,
    };
  };
  const openNew = () => {
    setEditId(null);
    const tcInfo = construirTC(cotizaciones, today());
    setForm({
      fecha: today(),
      proveedorId: "",
      productoId: "",
      cantidad: "",
      precio: "",
      moneda: "USD",
      entregaEst: "",
      obs: "",
      ...tcInfo,
    });
    setCompraItems([{ productoId: "", cantidad: "", precio: "", ivaPct: "" }]);
    setModal(true);
  };
  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      ...c,
      proveedorId: String(c?.proveedorId || ""),
      tc: num(c?.tc) || 1,
      obs: c?.obs || "",
    });
    setCompraItems([{
      productoId: c?.productoId || "",
      cantidad: c?.cantidad || "",
      precio: c?.precio || "",
      ivaPct: compraIvaPct(c, productos),
    }]);
    setModal(true);
  };
  const handleAnular = (motivo) => {
    if (!anularRec?.id) return;
    const targetIds = Array.isArray(anularRec.lineIds) && anularRec.lineIds.length
      ? anularRec.lineIds.map((x) => String(x))
      : [String(anularRec.id)];
    const targetIdSet = new Set(targetIds);
    const isGroupAnulacion = targetIdSet.size > 1 || !!anularRec?.isGroup;
    const compraBase = String(anularRec.ocBaseId || compraBaseId(anularRec));
    const nowIso = new Date().toISOString();
    const usuario = currentUser?.usuario || currentUser?.nombre || "-";
    const touchCompra = (row) => {
      const rid = String(row?.compraId || "");
      const rbase = String(row?.compraBaseId || "");
      if (rid && targetIdSet.has(rid)) return true;
      if (!rid && rbase === compraBase) return true;
      if (isGroupAnulacion && rbase === compraBase) return true;
      return false;
    };

    onUpdate("compras", compras.map((c) => targetIdSet.has(String(c.id)) ? {
      ...c,
      anulado: true,
      anuladoEl: nowIso,
      anuladoPor: usuario,
      motivoAnulacion: `Anulacion de compra ${Array.from(targetIdSet).join(", ")}: ${motivo}`,
    } : c));
    onUpdate("remitosCompra", remitosCompra.map((r) => touchCompra(r) ? {
      ...r,
      anulado: true,
      anuladoEl: nowIso,
      anuladoPor: usuario,
      motivoAnulacion: `Cascada por anulacion de compra ${Array.from(targetIdSet).join(", ")}: ${motivo}`,
    } : r));
    onUpdate("facturasCompra", facturasCompra.map((f) => touchCompra(f) ? {
      ...f,
      anulado: true,
      anuladoEl: nowIso,
      anuladoPor: usuario,
      motivoAnulacion: `Cascada por anulacion de compra ${Array.from(targetIdSet).join(", ")}: ${motivo}`,
    } : f));
    onUpdate("recibosCompra", recibosCompra.map((r) => touchCompra(r) ? {
      ...r,
      anulado: true,
      anuladoEl: nowIso,
      anuladoPor: usuario,
      motivoAnulacion: `Cascada por anulacion de compra ${Array.from(targetIdSet).join(", ")}: ${motivo}`,
    } : r));

    const chequeIdsAfectados = new Set(
      recibosCompra
        .filter((r) => touchCompra(r) && r.chequeId)
        .map((r) => String(r.chequeId)),
    );
    if (anularRec?.chequeId) chequeIdsAfectados.add(String(anularRec.chequeId));
    if (chequeIdsAfectados.size) {
      const nextCheques = cheques.map((ch) => {
        if (!chequeIdsAfectados.has(String(ch.id))) return ch;
        if (String(ch.tipo || "") === "terceros") {
          return {
            ...ch,
            estado: "en_cartera",
            proveedorDestino: null,
            compraId: null,
            reciboCompraId: null,
            fechaEstado: nowIso,
            historialEstados: [
              ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
              { fecha: nowIso, estado: "en_cartera", usuario, observacion: `Reversado por anulacion de compra ${Array.from(targetIdSet).join(", ")}` },
            ],
          };
        }
        return {
          ...ch,
          anulado: true,
          anuladoEl: nowIso,
          anuladoPor: usuario,
          motivoAnulacion: `Anulacion de compra ${Array.from(targetIdSet).join(", ")}: ${motivo}`,
          estado: "anulado",
          fechaEstado: nowIso,
        };
      });
      onUpdate("cheques", nextCheques);
    }
    setAnularRec(null);
  };
  const cascadeDeleteByCompraIds = (compraIds = [], opts = {}) => {
    const { includeBaseEvenWithId = false } = opts;
    const ids = Array.from(new Set((compraIds || []).map((x) => String(x))));
    if (!ids.length) return;
    const compraIdSet = new Set(ids);
    const comprasAfectadas = compras.filter((c) => compraIdSet.has(String(c.id)));
    const refSets = buildCompraDocRefSets(comprasAfectadas);
    const touchCompra = (row) => isCompraDocLinkedToRefs(row, refSets, { baseOnlyIfNoId: !includeBaseEvenWithId });
    const nextCompras = compras.filter((c) => !compraIdSet.has(String(c.id)));
    const nextRemitosCompra = remitosCompra.filter((r) => !touchCompra(r));
    const nextFacturasCompra = facturasCompra.filter((f) => !touchCompra(f));
    const nextRecibosCompra = recibosCompra.filter((r) => !touchCompra(r));
    const recibosEliminados = recibosCompra.filter((r) => touchCompra(r));
    const chequeIdSet = new Set(recibosEliminados.map((r) => String(r.chequeId || "")).filter(Boolean));
    let nextCheques = cheques;
    if (chequeIdSet.size) {
      const nowIso = new Date().toISOString();
      const usuario = currentUser?.usuario || currentUser?.nombre || "-";
      nextCheques = cheques
        .map((ch) => {
          if (!chequeIdSet.has(String(ch.id))) return ch;
          if (String(ch.tipo || "") === "terceros") {
            return {
              ...ch,
              estado: "en_cartera",
              proveedorDestino: null,
              compraId: null,
              reciboCompraId: null,
              fechaEstado: nowIso,
              historialEstados: [
                ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
                { fecha: nowIso, estado: "en_cartera", usuario, observacion: `Reversado por eliminacion fisica de compra (${ids.join(", ")})` },
              ],
            };
          }
          return null;
        })
        .filter(Boolean);
    }
    onUpdate("compras", nextCompras, { action: "ELIMINAR", detail: `Eliminacion fisica de ${ids.length} compra(s)` });
    onUpdate("remitosCompra", nextRemitosCompra, { action: "ELIMINAR", detail: "Eliminados remitos de compra vinculados" });
    onUpdate("facturasCompra", nextFacturasCompra, { action: "ELIMINAR", detail: "Eliminadas facturas de compra vinculadas" });
    onUpdate("recibosCompra", nextRecibosCompra, { action: "ELIMINAR", detail: "Eliminados recibos de compra vinculados" });
    if (nextCheques !== cheques) onUpdate("cheques", nextCheques, { action: "ELIMINAR", detail: "Ajustados cheques vinculados a compras eliminadas" });
  };
  const handleDeleteCompra = (c) => {
    if (!canDelete) return;
    if (!c?.id) return;
    if (!confirm(`¿Eliminar definitivamente ${c.id} y sus comprobantes vinculados?`)) return;
    cascadeDeleteByCompraIds([c.id]);
  };
  const handleDeleteCompraGroup = (group) => {
    if (!canDelete) return;
    const ids = group?.lines?.map((x) => String(x.id)) || [];
    if (!ids.length) return;
    if (!confirm(`¿Eliminar definitivamente la orden ${group.key} (${ids.length} renglón/es) y todos sus comprobantes vinculados?`)) return;
    cascadeDeleteByCompraIds(ids, { includeBaseEvenWithId: true });
  };
  const save = () => {
    if (!form.fecha || !form.proveedorId) return alert("Completa fecha y proveedor.");
    const parsedItems = compraItems.map((it) => ({
      productoId: +it.productoId,
      cantidad: +it.cantidad,
      precio: +it.precio,
      ivaPct: ivaPct(it.ivaPct),
      subtotal: num(it.cantidad) * num(it.precio),
      ivaMonto: ivaAmount(num(it.cantidad) * num(it.precio), ivaPct(it.ivaPct)),
      totalConIva: totalWithIva(num(it.cantidad) * num(it.precio), ivaPct(it.ivaPct)),
    }));
    const invalid = parsedItems.some((it) => !it.productoId || it.cantidad <= 0);
    if (invalid) return alert("Completa producto y cantidad en todos los renglones.");

    const head = {
      fecha: form.fecha,
      proveedorId: +form.proveedorId,
      moneda: String(form.moneda || "USD").toUpperCase(),
      tc: num(form.tc) || 1,
      entregaEst: form.entregaEst || "",
      obs: form.obs || "",
    };

    if (editId) {
      const it = parsedItems[0];
      const prev = compras.find((c) => String(c.id) === String(editId));
      if (!prev) return alert("No se encontro la compra a editar.");
      const rec = {
        ...prev,
        ...head,
        productoId: it.productoId,
        cantidad: it.cantidad,
        precio: it.precio,
        ivaPct: ivaPct(it.ivaPct),
        subtotal: it.subtotal,
        ivaMonto: it.ivaMonto,
        totalConIva: it.totalConIva,
      };
      onUpdate("compras", compras.map((c) => String(c.id) === String(editId) ? rec : c));
    } else {
      const n = num(data.cnt.oc) + 1;
      const baseId = `OC_${pad4(n)}`;
      const nuevos = parsedItems.map((it, idx) => ({
        ...head,
        id: parsedItems.length === 1 ? baseId : `${baseId}-${idx + 1}`,
        ocBaseId: baseId,
        ocLine: idx + 1,
        ocLines: parsedItems.length,
        productoId: it.productoId,
        cantidad: it.cantidad,
        precio: it.precio,
        ivaPct: ivaPct(it.ivaPct),
        subtotal: it.subtotal,
        ivaMonto: it.ivaMonto,
        totalConIva: it.totalConIva,
        pagado: 0,
        pagadoUSD: 0,
        medioPago: "",
      }));
      onUpdate("compras", [...compras, ...nuevos]);
      onUpdate("cnt", { ...data.cnt, oc: n });
    }
    setModal(false);
  };

  const openQuickRemito = (c, tracks) => {
    const n = num(data.cnt.rmp) + 1;
    setQRem({
      compraId: c.id,
      compraBaseId: c.ocBaseId || compraBaseId(c),
      proveedorId: c.proveedorId,
      productoId: c.productoId,
      fecha: today(),
      cantidad: tracks.pendEntrega,
      numeroRemito: `RMP_${pad4(n)}`,
      numeroProveedor: "",
      lote: "",
      obs: "",
    });
  };
  const saveQuickRemito = () => {
    const qty = num(qRem?.cantidad);
    if (qty <= 0) return alert("Ingresa una cantidad mayor a 0.");
    const compra = compras.find((c) => String(c.id) === String(qRem.compraId));
    if (!compra) return alert("No se encontro la compra.");
    const tracks = calcCompraTracks(compra);
    if (qty > tracks.pendEntrega + 0.0001) return alert(`No puedes remitir mas de lo pendiente (${fmt(tracks.pendEntrega, 2)} ${productoUnidad(productos, compra.productoId)}).`);
    const remId = String(qRem.numeroRemito || `RMP_${pad4(num(data.cnt.rmp) + 1)}`).trim();
    const remNum = Number((remId.match(/^RMP_(\d+)/) || [])[1] || num(data.cnt.rmp) + 1);
    onUpdate("remitosCompra", [...remitosCompra, {
      id: remId,
      numeroRemito: remId,
      numeroProveedor: String(qRem.numeroProveedor || "").trim(),
      fecha: qRem.fecha,
      compraId: compra.id,
      compraBaseId: compra.ocBaseId || compraBaseId(compra),
      proveedorId: compra.proveedorId,
      productoId: compra.productoId,
      cantidad: qty,
      lote: qRem.lote || "",
      obs: qRem.obs || "",
    }]);
    onUpdate("cnt", { ...data.cnt, rmp: Math.max(num(data.cnt.rmp), remNum) });
    setQRem(null);
  };

  const openQRemGroupCompra = (group) => {
    const items = group.lines.map((c) => {
      const t = calcCompraTracks(c);
      return {
        compraId: c.id,
        productoId: c.productoId,
        producto: lookupNombre(productos, c.productoId),
        unidad: productoUnidad(productos, c.productoId),
        max: t.pendEntrega,
        cantidad: t.pendEntrega,
        selected: t.pendEntrega > 0,
      };
    });
    if (!items.some((i) => i.max > 0)) return alert("No hay pendientes de remito en esta compra.");
    const n = num(data.cnt.rmp) + 1;
    setQRemGroup({ key: group.key, fecha: today(), numeroRemito: `RMP_${pad4(n)}`, numeroProveedor: "", items, obs: "", lote: "" });
  };

  const saveQRemGroupCompra = () => {
    const selected = qRemGroup.items.filter((i) => i.selected && num(i.cantidad) > 0);
    if (!selected.length) return alert("Selecciona al menos un producto para remitir.");
    const invalid = selected.find((i) => num(i.cantidad) > num(i.max));
    if (invalid) return alert(`La cantidad de ${invalid.producto} supera lo pendiente (${fmt(invalid.max, 2)} ${invalid.unidad || "u."}).`);
    const baseId = String(qRemGroup.numeroRemito || `RMP_${pad4(num(data.cnt.rmp) + 1)}`).trim();
    const baseNum = Number((baseId.match(/^RMP_(\d+)/) || [])[1] || num(data.cnt.rmp) + 1);
    const nuevos = selected.map((it, idx) => {
      const compra = compras.find((c) => String(c.id) === String(it.compraId));
      return {
        id: selected.length === 1 ? baseId : `${baseId}-${idx + 1}`,
        numeroRemito: selected.length === 1 ? baseId : `${baseId}-${idx + 1}`,
        numeroProveedor: String(qRemGroup.numeroProveedor || "").trim(),
        fecha: qRemGroup.fecha,
        compraId: it.compraId,
        compraBaseId: compra ? (compra.ocBaseId || compraBaseId(compra)) : "",
        proveedorId: compra?.proveedorId || "",
        productoId: it.productoId,
        cantidad: num(it.cantidad),
        lote: qRemGroup.lote || "",
        obs: qRemGroup.obs || "",
      };
    });
    onUpdate("remitosCompra", [...remitosCompra, ...nuevos]);
    onUpdate("cnt", { ...data.cnt, rmp: Math.max(num(data.cnt.rmp), baseNum) + (selected.length > 1 ? 0 : 0) });
    setQRemGroup(null);
  };

  const openQFacGroupCompra = (group) => {
    const items = group.lines.map((c) => {
      const t = calcCompraTracks(c);
      return {
        compraId: c.id,
        productoId: c.productoId,
        producto: lookupNombre(productos, c.productoId),
        unidad: productoUnidad(productos, c.productoId),
        precio: c.precio,
        ivaPct: compraIvaPct(c, productos),
        max: t.pendFacturar,
        cantidad: t.pendFacturar,
        selected: t.pendFacturar > 0,
      };
    });
    if (!items.some((i) => i.max > 0)) return alert("No hay productos pendientes de factura en esta compra.");
    setQFacGroup({ key: group.key, fecha: today(), fechaVencimiento: "", numeroProveedor: "", items });
  };

  const saveQFacGroupCompra = () => {
    const selected = qFacGroup.items.filter((i) => i.selected && num(i.cantidad) > 0);
    if (!selected.length) return alert("Selecciona al menos un producto para facturar.");
    const invalid = selected.find((i) => num(i.cantidad) > num(i.max));
    if (invalid) return alert(`La cantidad de ${invalid.producto} supera lo pendiente de factura (${fmt(invalid.max, 2)} ${invalid.unidad || "u."}).`);
    const n = num(data.cnt.fcp) + 1;
    const facBase = `FCP_${pad4(n)}`;
    const nuevos = selected.map((it, idx) => {
      const compra = compras.find((c) => String(c.id) === String(it.compraId));
      const qty = num(it.cantidad);
      const price = num(it.precio);
      const ivaLine = ivaPct(it.ivaPct);
      const subtotal = qty * price;
      const ivaMonto = ivaAmount(subtotal, ivaLine);
      const totalConIva = subtotal + ivaMonto;
      return {
        id: selected.length === 1 ? facBase : `${facBase}-${idx + 1}`,
        facBaseId: facBase,
        facLine: idx + 1,
        fecha: qFacGroup.fecha,
        fechaVencimiento: qFacGroup.fechaVencimiento || "",
        numeroProveedor: qFacGroup.numeroProveedor || "",
        compraId: it.compraId,
        compraBaseId: compra ? (compra.ocBaseId || compraBaseId(compra)) : "",
        proveedorId: compra?.proveedorId || "",
        productoId: it.productoId,
        cantidad: qty,
        precioUnit: price,
        ivaPct: ivaLine,
        subtotal,
        ivaMonto,
        totalConIva,
        moneda: compra?.moneda || "USD",
        tc: num(compra?.tc) || 1,
      };
    });
    onUpdate("facturasCompra", [...facturasCompra, ...nuevos]);
    onUpdate("cnt", { ...data.cnt, fcp: n });
    setQFacGroup(null);
  };

  const openQuickFactura = (c, tracks) => {
    setQFac({
      compraId: c.id,
      fecha: today(),
      cantidad: tracks.pendFacturar,
      precioUnit: num(c.precio),
      ivaPct: compraIvaPct(c, productos),
      numeroProveedor: "",
      fechaVencimiento: "",
      moneda: c.moneda || "USD",
      tc: num(c.tc) || 1,
    });
  };
  const saveQuickFactura = () => {
    const qty = num(qFac?.cantidad);
    if (qty <= 0) return alert("Ingresa una cantidad mayor a 0.");
    const compra = compras.find((c) => String(c.id) === String(qFac.compraId));
    if (!compra) return alert("No se encontro la compra.");
    const tracks = calcCompraTracks(compra);
    if (qty > tracks.pendFacturar + 0.0001) return alert(`No puedes facturar mas de lo pendiente (${fmt(tracks.pendFacturar, 2)}).`);
    const price = num(qFac.precioUnit);
    const ivaLine = ivaPct(qFac.ivaPct);
    const subtotal = qty * price;
    const ivaMonto = ivaAmount(subtotal, ivaLine);
    const totalConIva = subtotal + ivaMonto;
    const n = num(data.cnt.fcp) + 1;
    onUpdate("facturasCompra", [...facturasCompra, {
      id: `FCP_${pad4(n)}`,
      compraId: compra.id,
      compraBaseId: compra.ocBaseId || compraBaseId(compra),
      fecha: qFac.fecha,
      fechaVencimiento: qFac.fechaVencimiento || "",
      numeroProveedor: qFac.numeroProveedor || "",
      proveedorId: compra.proveedorId,
      productoId: compra.productoId,
      cantidad: qty,
      precioUnit: price,
      ivaPct: ivaLine,
      subtotal,
      ivaMonto,
      totalConIva,
      moneda: String(qFac.moneda || compra.moneda || "USD").toUpperCase(),
      tc: num(qFac.tc) || num(compra.tc) || 1,
    }]);
    onUpdate("cnt", { ...data.cnt, fcp: n });
    setQFac(null);
  };

  // opts.lines: para pagos de grupo (distribuye proporcionalmente entre líneas)
  const openQuickRecibo = (c, tracks, opts = {}) => {
    const { lines } = opts;
    const facPend = !lines ? facturasActivas
      .filter((f) => String(f.compraId || "") === String(c.id))
      .map((f) => ({ id: f.id, saldo: saldoFacturaCompraUSD(f.id), moneda: f.moneda || c.moneda || "USD", tc: num(f.tc) || num(c.tc) || 1 }))
      .find((f) => f.saldo > 0.01) : null;
    setQRec({
      numeroRecibo: `RCP_${pad4(num(data.cnt.rcp) + 1)}`,
      fecha: today(),
      compraId: c.id,
      compraBaseId: c.ocBaseId || compraBaseId(c),
      proveedorId: c.proveedorId,
      facturaCompraId: facPend?.id || "",
      pendCobrarUSD: Number(num(tracks.pendCobrar).toFixed(2)),
      monto: facPend ? Number(num(facPend.saldo).toFixed(2)) : Number(num(tracks.pendCobrar).toFixed(2)),
      moneda: String(facPend?.moneda || c.moneda || "USD").toUpperCase(),
      tc: num(facPend?.tc) || num(c.tc) || 1,
      medioPago: "TRANSFERENCIA",
      concepto: "",
      chequeSeleccionadoId: "",
      chequeNumero: "",
      chequeBanco: "",
      chequeFechaEmision: today(),
      chequePlazoDias: 0,
      chequeFechaVencimiento: "",
      chequeEstado: "entregado_proveedor",
      compraLines: lines || null,
    });
  };
  const saveQuickRecibo = () => {
    const compra = compras.find((c) => String(c.id) === String(qRec?.compraId));
    if (!compra) return alert("No se encontro la compra.");
    const recId = String(qRec.numeroRecibo || `RCP_${pad4(num(data.cnt.rcp) + 1)}`);
    let nextCnt = { ...data.cnt, rcp: Math.max(num(data.cnt.rcp), Number((recId.match(/^RCP_(\\d+)/) || [])[1] || 0)) };
    let monto = num(qRec.monto);
    let moneda = String(qRec.moneda || compra.moneda || "USD").toUpperCase();
    let tc = num(qRec.tc) || num(compra.tc) || 1;
    const medioPago = String(qRec.medioPago || "TRANSFERENCIA").toUpperCase();
    const usarSaldoFavor = medioPago === "SALDO_A_FAVOR";
    let chequeId = null;
    let nextCheques = cheques;
    const nowIso = new Date().toISOString();
    const usuario = currentUser?.usuario || currentUser?.nombre || "-";

    if (medioPago === "CHEQUE_TERCERO") {
      const chequeSelId = String(qRec.chequeSeleccionadoId || "");
      if (!chequeSelId) return alert("Selecciona un cheque de terceros.");
      const chequeSel = cheques.find((x) => String(x.id) === chequeSelId);
      if (!chequeSel) return alert("El cheque seleccionado no existe.");
      if (chequeSel.anulado || String(chequeSel.estado || "") === "anulado") return alert("El cheque seleccionado esta anulado.");
      if (String(chequeSel.tipo || "") !== "terceros") return alert("Solo puedes usar cheques de terceros.");
      if (String(chequeSel.estado || "en_cartera") !== "en_cartera") return alert("El cheque no esta disponible en cartera.");
      monto = num(chequeSel.importe);
      moneda = String(chequeSel.moneda || moneda).toUpperCase();
      tc = num(chequeSel.tc) || tc;
      chequeId = chequeSelId;
      nextCheques = cheques.map((ch) => String(ch.id) === chequeSelId ? {
        ...ch,
        estado: "entregado_proveedor",
        proveedorDestino: compra.proveedorId,
        compraId: compra.id,
        reciboCompraId: recId,
        fechaEstado: nowIso,
        historialEstados: [
          ...(Array.isArray(ch.historialEstados) ? ch.historialEstados : []),
          { fecha: nowIso, estado: "entregado_proveedor", usuario, observacion: `Aplicado en recibo compra ${recId}` },
        ],
      } : ch);
    }

    if (medioPago === "CHEQUE_PROPIO" || medioPago === "CHEQUE") {
      if (monto <= 0) return alert("El monto del recibo debe ser mayor a 0.");
      if (!qRec.chequeNumero || !qRec.chequeBanco) return alert("Completa numero y banco del cheque propio.");
      const fechaEmision = String(qRec.chequeFechaEmision || qRec.fecha || today()).slice(0, 10);
      const fechaVencimiento = calcFechaVencCheque({
        fechaEmision,
        plazoDias: qRec.chequePlazoDias,
        fechaVencimiento: qRec.chequeFechaVencimiento,
      });
      if (!fechaEmision || !fechaVencimiento) return alert("Completa fecha de emision y vencimiento del cheque.");
      const nChk = num(nextCnt.chk) + 1;
      chequeId = `CHK_${pad4(nChk)}`;
      nextCnt = { ...nextCnt, chk: nChk };
      const estado = CHEQUE_ESTADOS.includes(qRec.chequeEstado) ? qRec.chequeEstado : "entregado_proveedor";
      nextCheques = [
        ...nextCheques,
        {
          id: chequeId,
          tipo: "propio",
          numero: String(qRec.chequeNumero || "").trim(),
          banco: String(qRec.chequeBanco || "").trim(),
          importe: monto,
          moneda,
          tc,
          fechaEmision,
          plazoDias: hasValue(qRec.chequePlazoDias) ? num(qRec.chequePlazoDias) : 0,
          fechaVencimiento,
          clienteOrigen: null,
          proveedorDestino: compra.proveedorId,
          compraId: compra.id,
          reciboCompraId: recId,
          estado,
          fechaEstado: nowIso,
          historialEstados: [
            { fecha: nowIso, estado, usuario, observacion: `Alta desde recibo compra ${recId}` },
          ],
        },
      ];
    }

    if (monto <= 0) return alert("Ingresa un monto mayor a 0.");
    if (usarSaldoFavor) {
      if (!qRec.facturaCompraId) return alert("Selecciona una factura de compra para aplicar saldo a favor.");
      moneda = "USD";
      tc = 1;
      const disponible = saldoFavorProveedorDisponibleUSD({
        proveedorId: compra.proveedorId,
        fechaHasta: qRec.fecha,
        compras,
        facturasCompra,
        recibosCompra,
        notasDebito,
        notasCredito,
        productos,
      });
      const montoUsdFavor = moneyToUSD(monto, moneda, tc);
      monto = montoUsdFavor;
      moneda = "USD";
      tc = 1;
      if (montoUsdFavor > disponible + 0.01) {
        return alert(`Saldo a favor insuficiente. Disponible: USD ${fmt(disponible)}.`);
      }
    }
    if (qRec.facturaCompraId) {
      const saldo = saldoFacturaCompraUSD(qRec.facturaCompraId);
      const usd = moneyToUSD(monto, moneda, tc);
      if (usd > saldo + 0.01) return alert(`Ese pago supera el saldo de la factura (USD ${fmt(saldo)}).`);
    }

    if (usarSaldoFavor && Array.isArray(qRec.compraLines) && qRec.compraLines.length > 1) {
      return alert("Para aplicar saldo a favor, registra el pago sobre una sola factura de compra.");
    }

    // Pago grupal: distribuir proporcionalmente entre todas las líneas
    if (Array.isArray(qRec.compraLines) && qRec.compraLines.length > 1) {
      const lines = qRec.compraLines;
      const lineTotals = lines.map((c) => ({ c, total: compraTotalUSD(c) }));
      const groupTotal = lineTotals.reduce((s, x) => s + x.total, 0);
      let cntRcp = num(nextCnt.rcp);
      const splitRecibos = [];
      let remaining = monto;
      for (let i = 0; i < lineTotals.length; i++) {
        const { c, total } = lineTotals[i];
        const isLast = i === lineTotals.length - 1;
        const lineMonto = isLast
          ? Number(remaining.toFixed(2))
          : Number((monto * (groupTotal > 0 ? total / groupTotal : 1 / lines.length)).toFixed(2));
        if (!isLast) remaining -= lineMonto;
        cntRcp += 1;
        splitRecibos.push({
          id: `RCP_${pad4(cntRcp)}`,
          numeroRecibo: `RCP_${pad4(cntRcp)}`,
          fecha: qRec.fecha,
          compraId: c.id,
          compraBaseId: c.ocBaseId || compraBaseId(c),
          proveedorId: c.proveedorId,
          facturaCompraId: "",
          monto: lineMonto,
          moneda,
          tc,
          medioPago,
          chequeId,
          impactaCuenta: !usarSaldoFavor,
          concepto: qRec.concepto || "",
        });
      }
      onUpdate("recibosCompra", [...recibosCompra, ...splitRecibos]);
      if (nextCheques !== cheques) onUpdate("cheques", nextCheques);
      onUpdate("cnt", { ...nextCnt, rcp: cntRcp });
      setQRec(null);
      return;
    }

    onUpdate("recibosCompra", [...recibosCompra, {
      id: recId,
      numeroRecibo: recId,
      fecha: qRec.fecha,
      compraId: compra.id,
      compraBaseId: compra.ocBaseId || compraBaseId(compra),
      proveedorId: compra.proveedorId,
      facturaCompraId: qRec.facturaCompraId || "",
      monto,
      moneda,
      tc,
      medioPago,
      chequeId,
      impactaCuenta: !usarSaldoFavor,
      concepto: qRec.concepto || "",
    }]);
    if (nextCheques !== cheques) onUpdate("cheques", nextCheques);
    onUpdate("cnt", nextCnt);
    setQRec(null);
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

  const resumenFormUsd = compraItems.reduce((acc, it) => {
    const baseMon = num(it.cantidad) * num(it.precio);
    const ivaLine = hasValue(it.ivaPct)
      ? ivaPct(it.ivaPct)
      : (hasValue(it.productoId) ? productoIvaPct(productos, it.productoId) : 0);
    const ivaMon = ivaAmount(baseMon, ivaLine);
    const totalMon = baseMon + ivaMon;
    acc.subtotal += moneyToUSD(baseMon, form.moneda, form.tc);
    acc.iva += moneyToUSD(ivaMon, form.moneda, form.tc);
    acc.total += moneyToUSD(totalMon, form.moneda, form.tc);
    return acc;
  }, { subtotal: 0, iva: 0, total: 0 });
  const total = resumenFormUsd.total;
  const subtotalFormUsd = resumenFormUsd.subtotal;
  const ivaFormUsd = resumenFormUsd.iva;
  const totalFormUsd = resumenFormUsd.total;
  const usaSaldoFavorQuick = String(qRec?.medioPago || "").toUpperCase() === "SALDO_A_FAVOR";
  const saldoFavorDisponibleQuick = saldoFavorProveedorDisponibleUSD({
    proveedorId: qRec?.proveedorId,
    fechaHasta: qRec?.fecha || today(),
    compras,
    facturasCompra,
    recibosCompra,
    notasDebito,
    notasCredito,
    productos,
  });
  const chequeTerceroActualId = String(qRec?.chequeSeleccionadoId || "");
  const chequesTercerosDisponibles = cheques
    .filter((ch) => String(ch.tipo || "") === "terceros")
    .filter((ch) => !ch.anulado)
    .filter((ch) => {
      const id = String(ch.id || "");
      if (id && id === chequeTerceroActualId) return true;
      return String(ch.estado || "en_cartera") === "en_cartera";
    })
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")));
  // ── Agrupamiento de compras (igual a Operaciones) ──────────────────────────
  const compraGroupMap = new Map();
  const compraGroupsList = [];
  for (const c of compras) {
    const key = c.ocBaseId || compraBaseId(c);
    if (!compraGroupMap.has(key)) {
      const g = { key, lines: [] };
      compraGroupMap.set(key, g);
      compraGroupsList.push(g);
    }
    compraGroupMap.get(key).lines.push(c);
  }
  for (const g of compraGroupsList) {
    g.lines.sort((a, b) => num(a.ocLine || 1) - num(b.ocLine || 1));
    g.head = g.lines[0];
    g.multi = g.lines.length > 1;
    const linesTracks = g.lines.map((c) => calcCompraTracks(c));
    g.tracks = {
      comprometido: linesTracks.reduce((s, t) => s + t.comprometido, 0),
      remitado: linesTracks.reduce((s, t) => s + t.remitado, 0),
      facturado: linesTracks.reduce((s, t) => s + t.facturado, 0),
      cobradoUSD: linesTracks.reduce((s, t) => s + t.cobradoUSD, 0),
      totalFacturadoUSD: linesTracks.reduce((s, t) => s + t.totalFacturadoUSD, 0),
      pendEntrega: linesTracks.reduce((s, t) => s + t.pendEntrega, 0),
      pendFacturar: linesTracks.reduce((s, t) => s + t.pendFacturar, 0),
      pendCobrar: linesTracks.reduce((s, t) => s + t.pendCobrar, 0),
      done: linesTracks.every((t) => t.done),
    };
    const tFac = g.tracks.totalFacturadoUSD;
    g.totalUSD = tFac > 0.0001 ? tFac : g.lines.reduce((s, c) => s + compraTotalUSD(c), 0);
    g.productLabel = g.multi ? `${g.lines.length} productos` : lookupNombre(productos, g.head.productoId);
    g.qtyLabel = g.multi ? g.lines.reduce((s, c) => s + num(c.cantidad), 0) : g.head.cantidad;
  }

  const compraFilterDefs = [
    { id: "all", label: "Todas", match: () => true },
    { id: "pend_remito", label: "Pend. Remito", match: (g) => g.tracks.pendEntrega > 0.01 },
    { id: "pend_factura", label: "Pend. Factura", match: (g) => g.tracks.pendFacturar > 0.01 },
    { id: "pend_recibo", label: "Pend. Recibo", match: (g) => g.tracks.pendCobrar > 0.01 },
  ];
  const activeCompraFilter = compraFilterDefs.find((f) => f.id === compraFilter) || compraFilterDefs[0];
  const filteredGroups = compraGroupsList
    .filter((g) => inDateRange(g.head?.fecha, dateRange))
    .filter((g) => showAnulados || !g.lines.every((l) => l.anulado))
    .filter((g) => activeCompraFilter.match(g));

  return (
    <div>
      <PageHdr title="Compras y Abastecimiento" sub="Ordenes de compra a proveedores" onNew={openNew} btn="+ Nueva Compra" />
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Filtrar:</span>
        {compraFilterDefs.map((f) => (
          <button
            key={f.id}
            onClick={() => setCompraFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              compraFilter === f.id
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-gray-400">{filteredGroups.length} de {compraGroupsList.length} compras</span>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
      </div>
      <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredGroups.length} total={compraGroupsList.length} />
      <Card className="overflow-hidden">
        <div className="max-h-[66vh] overflow-y-auto overflow-x-scroll" style={{ scrollbarGutter: "stable both-edges" }}>
          <table className="w-full text-xs table-fixed min-w-[1100px]">
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <THead compact sticky center green cols={["", "ID", "Fecha", "Proveedor", "Producto", "Cant.", "Total USD", "Prog.", "Acciones", "Estado", ""]} />
            <tbody>
              {filteredGroups.map((group) => {
                const exp = expandId === group.key;
                const head = group.head;
                const tracks = group.tracks;
                const totalUsd = group.totalUSD;
                const saldoUsd = totalUsd - tracks.cobradoUSD;
                const allAnulado = group.lines.every((l) => l.anulado);
                const st = tracks.pendEntrega > 0.01
                  ? (tracks.remitado > 0.01 ? "Parcial" : "Pendiente")
                  : tracks.pendFacturar > 0.01 ? "Pend. Factura"
                  : saldoUsd > 0.01 ? "Pend. Pago"
                  : saldoUsd < -0.01 ? "Saldo a favor"
                  : "Completa";
                return (
                  <Fragment key={group.key}>
                    <TR
                      highlight={navTarget?.module === "compras" && String(navTarget?.id) === String(head.id)}
                      rowRef={(el) => { rowRefs.current[group.key] = el; }}
                      className={allAnulado ? "opacity-50 line-through" : ""}
                    >
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
                      <TD center compact>{fmtD(head.fecha)}</TD>
                      <TD center compact bold nowrap={false}>{lookupNombre(proveedores, head.proveedorId)}</TD>
                      <TD center compact nowrap={false}>{group.productLabel}</TD>
                      <TD center compact>{group.qtyLabel}</TD>
                      <TD center compact bold>USD {fmt(totalUsd)}</TD>
                      <td className="px-2 py-1.5 align-middle text-center"><TrackPanelCompras tracks={tracks} compact /></td>
                      <td className="px-1.5 py-1.5 align-middle text-center">
                        {group.multi ? (
                          <div className="flex flex-col gap-1 w-full min-w-0">
                            {tracks.pendEntrega > 0.01 && (
                              <button onClick={() => openQRemGroupCompra(group)} className="w-full px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-semibold border border-blue-100 whitespace-nowrap">
                                Remito ({fmt(tracks.pendEntrega, 2)})
                              </button>
                            )}
                            {tracks.pendFacturar > 0.01 && (
                              <button onClick={() => openQFacGroupCompra(group)} className="w-full px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg text-[10px] font-semibold border border-violet-100 whitespace-nowrap">
                                Factura ({fmt(tracks.pendFacturar, 2)})
                              </button>
                            )}
                            {tracks.pendCobrar > 0.01 && totalUsd > 0 && (
                              <button onClick={() => openQuickRecibo(head, tracks, { lines: group.lines })} className="w-full px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-semibold border border-emerald-100 whitespace-nowrap">
                                Recibo (USD {fmt(tracks.pendCobrar)})
                              </button>
                            )}
                            {tracks.done && <span className="text-[10px] text-gray-300">Sin pendientes</span>}
                          </div>
                        ) : (
                          <QuickActionsCompra compra={head} tracks={tracks} compact onQR={openQuickRemito} onQF={openQuickFactura} onQP={openQuickRecibo} />
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center"><Bdg s={allAnulado ? "Anulado" : st} /></td>
                      {group.multi ? (
                        <td className="px-1.5 py-1.5 align-middle text-center">
                          <div className="flex justify-center gap-0.5">
                            {canDelete && !allAnulado && (
                              <button
                                onClick={() => setAnularRec({
                                  ...head,
                                  id: group.key,
                                  ocBaseId: group.key,
                                  lineIds: group.lines.map((x) => String(x.id)),
                                  isGroup: true,
                                })}
                                className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                title="Anular orden"
                              >
                                <IconBan className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDeleteCompraGroup(group)} className="p-1 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Eliminar orden">
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      ) : (
                        <Btns compact anulado={head.anulado} onEdit={() => openEdit(head)} onAnular={() => setAnularRec(head)} onDel={() => handleDeleteCompra(head)} showDeleteWithAnular />
                      )}
                    </TR>
                    {exp && (
                      <tr key={`${group.key}-d`} className="bg-slate-50 border-b border-gray-100">
                        <td colSpan={11} className="px-8 py-4">
                          <table className="w-full text-[11px] table-fixed">
                            <THead compact center green cols={["ID", "Producto", "Cant.", "Precio", "IVA", "Total USD", "Prog.", "Acciones", ""]} />
                            <tbody>
                              {group.lines.map((c) => {
                                const tt = calcCompraTracks(c);
                                const tTotal = tt.totalFacturadoUSD > 0.0001 ? tt.totalFacturadoUSD : compraTotalUSD(c);
                                return (
                                  <TR key={c.id} className={c.anulado ? "opacity-50 line-through" : ""}>
                                    <TD center compact mono gray>{c.id}</TD>
                                    <TD center compact nowrap={false}>{lookupNombre(productos, c.productoId)}</TD>
                                    <TD center compact>{c.cantidad}</TD>
                                    <TD center compact>{fmt(c.precio)} {c.moneda}</TD>
                                    <TD center compact>{fmt(compraIvaPct(c, productos), 1)}%</TD>
                                    <TD center compact bold>USD {fmt(tTotal)}</TD>
                                    <td className="px-2 py-1.5 align-middle text-center"><TrackPanelCompras tracks={tt} compact /></td>
                                    <td className="px-1.5 py-1.5 align-middle text-center">
                                      <QuickActionsCompra compra={c} tracks={tt} compact onQR={openQuickRemito} onQF={openQuickFactura} onQP={openQuickRecibo} />
                                    </td>
                                    <Btns compact anulado={c.anulado} onEdit={() => openEdit(c)} onAnular={() => setAnularRec(c)} onDel={() => handleDeleteCompra(c)} showDeleteWithAnular />
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
      {modal && (
        <Modal title={editId ? "Editar Compra" : "Nueva Orden de Compra"} wide onClose={() => setModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha||""} onChange={e=>sf("fecha",e.target.value)} /></Fl>
            <Fl label="Proveedor *">
              <SearchSelect
                value={form.proveedorId || ""}
                placeholder="Seleccionar..."
                options={proveedores.map((p) => ({
                  value: String(p.id),
                  label: p.nombre,
                  searchText: `${p.nombre} ${p.cuit || ""}`,
                }))}
                onChange={(proveedorId) => sf("proveedorId", String(proveedorId || ""))}
                emptyLabel="Sin proveedores"
              />
            </Fl>
            <Fl label="Moneda"><select className={IC} value={form.moneda||"USD"} onChange={e=>sf("moneda",e.target.value)}><option>USD</option><option>PESOS</option></select></Fl>
            {(String(form.moneda||"USD").toUpperCase()==="PESOS"||String(form.moneda||"USD").toUpperCase()==="ARS") && (
              <Fl label="Tipo de Cambio (TC)"><input type="number" step="0.01" className={IC} value={form.tc||""} onChange={e=>sf("tc",e.target.value)} /></Fl>
            )}
            <Fl label="Entrega Estimada"><input type="date" className={IC} value={form.entregaEst||""} onChange={e=>sf("entregaEst",e.target.value)} /></Fl>
            <Fl label={editId ? "Producto *" : "Productos *"} span2>
              <div className="space-y-3">
                {compraItems.map((it, idx) => {
                  const subBase = num(it.cantidad) * num(it.precio);
                  const monedaF = String(form.moneda || "USD").toUpperCase();
                  const subUsd = (monedaF === "PESOS" || monedaF === "ARS") ? subBase / (num(form.tc) || 1) : subBase;
                  const ivaItem = hasValue(it.ivaPct) ? ivaPct(it.ivaPct) : (hasValue(it.productoId) ? productoIvaPct(productos, it.productoId) : null);
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="col-span-5">
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Producto</label>
                        <SelProd
                          className={`compra-prod-sel-${idx}`}
                          val={it.productoId}
                          onChange={e => {
                            const p = productos.find(pr => pr.id === +e.target.value);
                            const sugerido = num(p?.ultimoCosto) || num(p?.costoPromedio) || num(p?.costo) || "";
                            setCompraItem(idx, "productoId", e.target.value);
                            setCompraItem(idx, "precio", sugerido);
                            setCompraItem(idx, "ivaPct", ivaPct(p?.iva));
                            setTimeout(() => { precioRefs.current[idx]?.focus(); precioRefs.current[idx]?.select(); }, 0);
                          }}
                          productos={productos}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Precio compra</label>
                        <input
                          ref={(el) => { precioRefs.current[idx] = el; }}
                          type="number"
                          step="0.01"
                          className={IC}
                          value={it.precio || ""}
                          onChange={e => setCompraItem(idx, "precio", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            cantidadRefs.current[idx]?.focus();
                            cantidadRefs.current[idx]?.select();
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cantidad</label>
                        <input
                          ref={(el) => { cantidadRefs.current[idx] = el; }}
                          type="number"
                          className={IC}
                          value={it.cantidad || ""}
                          onChange={e => setCompraItem(idx, "cantidad", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            if (editId) { document.getElementById("compra-obs-input")?.focus(); return; }
                            if (idx < compraItems.length - 1) { focusProductoRow(idx + 1); return; }
                            addCompraItem({ focus: true });
                          }}
                        />
                      </div>
                      <div className="col-span-1 pb-1 text-center">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">IVA</p>
                        <p className="text-sm font-bold text-blue-700">{ivaItem == null ? "-" : `${fmt(ivaItem, 1)}%`}</p>
                      </div>
                      <div className="col-span-1 pb-1 text-right">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Subtotal</p>
                        <p className="text-sm font-bold text-gray-700">{subUsd > 0 ? `USD ${fmt(subUsd)}` : "-"}</p>
                      </div>
                      {!editId && (
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => delCompraItem(idx)} disabled={compraItems.length === 1} className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30 inline-flex items-center justify-center">
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!editId && (
                  <button type="button" onClick={addCompraItem} className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-semibold">
                    + Agregar producto
                  </button>
                )}
              </div>
            </Fl>
            <Fl label="Observaciones" span2><input id="compra-obs-input" type="text" className={IC} value={form.obs||""} onChange={e=>sf("obs",e.target.value)} /></Fl>
          </div>
          {total > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Subtotal</p><p className="font-bold">USD {fmt(subtotalFormUsd)}</p></div>
              <div><p className="text-xs text-gray-400">IVA total</p><p className="font-bold">USD {fmt(ivaFormUsd)}</p></div>
              <div>
                <p className="text-xs text-gray-400">Total c/IVA</p>
                <p className={`font-bold ${totalFormUsd < -0.01 ? "text-emerald-700" : totalFormUsd > 0.01 ? "text-amber-700" : "text-gray-700"}`}>
                  USD {fmt(totalFormUsd)}
                </p>
              </div>
            </div>
          )}
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
      {qRem && (
        <Modal title={`Nuevo Remito de Compra - ${qRem.compraId}`} onClose={() => setQRem(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Nro interno remito"><input type="text" className={IC} value={qRem.numeroRemito || ""} onChange={e => setQRem(r => ({ ...r, numeroRemito: e.target.value }))} /></Fl>
            <Fl label="Nro remito proveedor"><input type="text" className={IC} value={qRem.numeroProveedor || ""} onChange={e => setQRem(r => ({ ...r, numeroProveedor: e.target.value }))} /></Fl>
            <Fl label="Fecha *"><input type="date" className={IC} value={qRem.fecha} onChange={e => setQRem(r => ({ ...r, fecha: e.target.value }))} /></Fl>
            <Fl label="Cantidad *"><input type="number" className={IC} value={qRem.cantidad} onChange={e => setQRem(r => ({ ...r, cantidad: e.target.value }))} /></Fl>
            <Fl label="Lote"><input type="text" className={IC} value={qRem.lote || ""} onChange={e => setQRem(r => ({ ...r, lote: e.target.value }))} /></Fl>
            <Fl label="Observaciones" span2><input type="text" className={IC} value={qRem.obs || ""} onChange={e => setQRem(r => ({ ...r, obs: e.target.value }))} /></Fl>
          </div>
          <FBtns onSave={saveQuickRemito} onCancel={() => setQRem(null)} saveLabel="Generar Remito" />
        </Modal>
      )}
      {qRemGroup && (
        <Modal title={`Remitir Compra ${qRemGroup.key}`} wide onClose={() => setQRemGroup(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Nro interno remito"><input type="text" className={IC} value={qRemGroup.numeroRemito || ""} onChange={e => setQRemGroup(g => ({ ...g, numeroRemito: e.target.value }))} /></Fl>
            <Fl label="Nro remito proveedor"><input type="text" className={IC} value={qRemGroup.numeroProveedor || ""} onChange={e => setQRemGroup(g => ({ ...g, numeroProveedor: e.target.value }))} /></Fl>
            <Fl label="Fecha *"><input type="date" className={IC} value={qRemGroup.fecha} onChange={e => setQRemGroup(g => ({ ...g, fecha: e.target.value }))} /></Fl>
            <Fl label="Lote (opcional)"><input type="text" className={IC} value={qRemGroup.lote || ""} onChange={e => setQRemGroup(g => ({ ...g, lote: e.target.value }))} /></Fl>
            <Fl label="Observaciones"><input type="text" className={IC} value={qRemGroup.obs || ""} onChange={e => setQRemGroup(g => ({ ...g, obs: e.target.value }))} /></Fl>
          </div>
          <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <THead cols={["", "Artículo", "Producto", "Pendiente", "Cantidad a Remitir"]} />
              <tbody>
                {qRemGroup.items.map((it, idx) => (
                  <TR key={`${it.compraId}-${idx}`} highlight={it.selected}>
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={!!it.selected}
                        disabled={it.max <= 0}
                        onChange={e => setQRemGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x) }))}
                      />
                    </td>
                    <TD mono gray>{it.compraId}</TD>
                    <TD>{it.producto}</TD>
                    <TD center>{fmt(it.max, 2)}</TD>
                    <td className="px-3 py-2">
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
          <FBtns onSave={saveQRemGroupCompra} onCancel={() => setQRemGroup(null)} saveLabel="Generar Remitos Seleccionados" />
        </Modal>
      )}
      {qFac && (
        <Modal title={`Nueva Factura de Compra - ${qFac.compraId}`} onClose={() => setQFac(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Nro Factura Proveedor"><input type="text" className={IC} value={qFac.numeroProveedor || ""} onChange={e => setQFac(f => ({ ...f, numeroProveedor: e.target.value }))} /></Fl>
            <Fl label="Fecha *"><input type="date" className={IC} value={qFac.fecha} onChange={e => setQFac(f => ({ ...f, fecha: e.target.value }))} /></Fl>
            <Fl label="Vencimiento"><input type="date" className={IC} value={qFac.fechaVencimiento || ""} onChange={e => setQFac(f => ({ ...f, fechaVencimiento: e.target.value }))} /></Fl>
            <Fl label="Cantidad"><input type="number" className={IC} value={qFac.cantidad} onChange={e => setQFac(f => ({ ...f, cantidad: e.target.value }))} /></Fl>
            <Fl label="Precio unitario"><input type="number" step="0.01" className={IC} value={qFac.precioUnit} onChange={e => setQFac(f => ({ ...f, precioUnit: e.target.value }))} /></Fl>
            <Fl label="IVA %"><select className={IC} value={qFac.ivaPct || 21} onChange={e => setQFac(f => ({ ...f, ivaPct: +e.target.value }))}><option value={10.5}>10.5%</option><option value={21}>21%</option></select></Fl>
          </div>
          <FBtns onSave={saveQuickFactura} onCancel={() => setQFac(null)} saveLabel="Emitir Factura" />
        </Modal>
      )}
      {qFacGroup && (
        <Modal title={`Facturar Compra ${qFacGroup.key}`} wide onClose={() => setQFacGroup(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Nro Factura Proveedor"><input type="text" className={IC} value={qFacGroup.numeroProveedor || ""} onChange={e => setQFacGroup(g => ({ ...g, numeroProveedor: e.target.value }))} /></Fl>
            <Fl label="Fecha *"><input type="date" className={IC} value={qFacGroup.fecha} onChange={e => setQFacGroup(g => ({ ...g, fecha: e.target.value }))} /></Fl>
            <Fl label="Vencimiento"><input type="date" className={IC} value={qFacGroup.fechaVencimiento || ""} onChange={e => setQFacGroup(g => ({ ...g, fechaVencimiento: e.target.value }))} /></Fl>
          </div>
          <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <THead cols={["", "Artículo", "Producto", "Precio", "Pendiente", "Cantidad a Facturar"]} />
              <tbody>
                {qFacGroup.items.map((it, idx) => (
                  <TR key={`${it.compraId}-${idx}`} highlight={it.selected}>
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={!!it.selected}
                        disabled={it.max <= 0}
                        onChange={e => setQFacGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x) }))}
                      />
                    </td>
                    <TD mono gray>{it.compraId}</TD>
                    <TD>{it.producto}</TD>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className={IC}
                        value={it.precio}
                        onChange={e => setQFacGroup(g => ({ ...g, items: g.items.map((x, i) => i === idx ? { ...x, precio: e.target.value } : x) }))}
                      />
                    </td>
                    <TD center>{fmt(it.max, 2)}</TD>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={IC}
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
          <FBtns onSave={saveQFacGroupCompra} onCancel={() => setQFacGroup(null)} saveLabel="Emitir Facturas Seleccionadas" />
        </Modal>
      )}
      {qRec && (
        <Modal title={`Nuevo Recibo de Compra - ${qRec.compraId}`} onClose={() => setQRec(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Numero Recibo"><input type="text" className={IC} value={qRec.numeroRecibo || ""} onChange={e => setQRec(r => ({ ...r, numeroRecibo: e.target.value }))} /></Fl>
            <Fl label="Fecha *"><input type="date" className={IC} value={qRec.fecha || ""} onChange={e => setQRec(r => ({ ...r, fecha: e.target.value }))} /></Fl>
            <Fl label="Factura asociada (opcional)">
              <select className={IC} value={qRec.facturaCompraId || ""} onChange={e => setQRec(r => ({ ...r, facturaCompraId: e.target.value }))}>
                <option value="">Sin vincular</option>
                {facturasActivas.filter(f => String(f.compraId || "") === String(qRec.compraId)).map(f => (
                  <option key={f.id} value={f.id}>{f.id} - saldo USD {fmt(saldoFacturaCompraUSD(f.id))}</option>
                ))}
              </select>
            </Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={qRec.medioPago || "TRANSFERENCIA"} onChange={e => {
                const nextMedio = String(e.target.value || "").toUpperCase();
                if (nextMedio === "SALDO_A_FAVOR") {
                  const pend = num(qRec.pendCobrarUSD || qRec.monto || 0);
                  const sugerido = Math.min(pend > 0 ? pend : num(qRec.monto || 0), saldoFavorDisponibleQuick);
                  setQRec((r) => ({
                    ...r,
                    medioPago: nextMedio,
                    moneda: "USD",
                    tc: 1,
                    monto: Number(Math.max(0, sugerido).toFixed(2)),
                  }));
                  return;
                }
                setQRec(r => ({ ...r, medioPago: nextMedio }));
              }}>
                {MEDIOS_PAGO_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Fl>
            {usaSaldoFavorQuick && (
              <Fl label="Saldo a favor disponible">
                <div className="h-[42px] rounded-xl border border-emerald-200 bg-emerald-50 px-3 flex items-center text-emerald-700 font-semibold">
                  USD {fmt(saldoFavorDisponibleQuick)}
                </div>
              </Fl>
            )}
            <Fl label="Cantidad / Monto *"><input type="number" step="0.01" className={IC} value={qRec.monto || ""} disabled={String(qRec.medioPago || "").toUpperCase() === "CHEQUE_TERCERO"} onChange={e => setQRec(r => ({ ...r, monto: e.target.value }))} /></Fl>
            <Fl label="Moneda">
              <select className={IC} disabled={usaSaldoFavorQuick} value={qRec.moneda || "USD"} onChange={e => {
                const nextMoneda = e.target.value;
                setQRec((r) => {
                  const pendUSD = num(r.pendCobrarUSD || r.monto);
                  const nextMonto = pendUSD > 0 ? Number(usdToMoney(pendUSD, nextMoneda, r.tc).toFixed(2)) : r.monto;
                  return { ...r, moneda: nextMoneda, monto: nextMonto };
                });
              }}>
                <option value="USD">USD</option><option value="PESOS">PESOS</option>
              </select>
            </Fl>
            <Fl label="TC">
              <input type="number" step="0.01" className={IC} disabled={usaSaldoFavorQuick} value={qRec.tc || ""} onChange={e => {
                const nextTc = e.target.value;
                setQRec((r) => {
                  const pendUSD = num(r.pendCobrarUSD || r.monto);
                  const nextMonto = pendUSD > 0 ? Number(usdToMoney(pendUSD, r.moneda, nextTc).toFixed(2)) : r.monto;
                  return { ...r, tc: nextTc, monto: nextMonto };
                });
              }} />
            </Fl>
            {String(qRec.medioPago || "").toUpperCase() === "CHEQUE_TERCERO" && (
              <Fl label="Cheque de terceros *" span2>
                <SearchSelect
                  value={qRec.chequeSeleccionadoId || ""}
                  placeholder="Seleccionar cheque en cartera..."
                  options={chequesTercerosDisponibles.map((ch) => ({
                    value: String(ch.id),
                    label: `${ch.id} - ${ch.banco || "Sin banco"} - ${ch.moneda} ${fmt(ch.importe, 0)} - vence ${fmtD(ch.fechaVencimiento)}`,
                    searchText: `${ch.id} ${ch.numero || ""} ${ch.banco || ""}`,
                  }))}
                  clearable
                  clearLabel="Sin seleccionar"
                  emptyLabel="No hay cheques de terceros disponibles"
                  onChange={(chequeId) => {
                    const nextId = String(chequeId || "");
                    const ch = cheques.find((x) => String(x.id) === nextId) || null;
                    if (!ch) return setQRec((r) => ({ ...r, chequeSeleccionadoId: "" }));
                    setQRec((r) => ({
                      ...r,
                      chequeSeleccionadoId: nextId,
                      monto: num(ch.importe) || 0,
                      moneda: String(ch.moneda || r.moneda || "USD").toUpperCase(),
                      tc: num(ch.tc) || num(r.tc) || 1,
                    }));
                  }}
                />
              </Fl>
            )}
            {(String(qRec.medioPago || "").toUpperCase() === "CHEQUE_PROPIO" || String(qRec.medioPago || "").toUpperCase() === "CHEQUE") && (
              <>
                <Fl label="Nro cheque *"><input type="text" className={IC} value={qRec.chequeNumero || ""} onChange={e => setQRec(r => ({ ...r, chequeNumero: e.target.value }))} /></Fl>
                <Fl label="Banco *"><input type="text" className={IC} value={qRec.chequeBanco || ""} onChange={e => setQRec(r => ({ ...r, chequeBanco: e.target.value }))} /></Fl>
                <Fl label="Fecha emision *"><input type="date" className={IC} value={qRec.chequeFechaEmision || ""} onChange={e => setQRec(r => ({ ...r, chequeFechaEmision: e.target.value }))} /></Fl>
                <Fl label="Plazo (dias)">
                  <select className={IC} value={hasValue(qRec.chequePlazoDias) ? qRec.chequePlazoDias : 0} onChange={e => setQRec(r => ({ ...r, chequePlazoDias: e.target.value }))}>
                    {[0, 30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Fl>
                <Fl label="Vencimiento exacto"><input type="date" className={IC} value={qRec.chequeFechaVencimiento || ""} onChange={e => setQRec(r => ({ ...r, chequeFechaVencimiento: e.target.value }))} /></Fl>
                <Fl label="Estado cheque">
                  <select className={IC} value={qRec.chequeEstado || "entregado_proveedor"} onChange={e => setQRec(r => ({ ...r, chequeEstado: e.target.value }))}>
                    {CHEQUE_ESTADOS.map((st) => <option key={st} value={st}>{chequeEstadoLabel(st)}</option>)}
                  </select>
                </Fl>
              </>
            )}
          </div>
          <FBtns onSave={saveQuickRecibo} onCancel={() => setQRec(null)} saveLabel="Registrar Recibo" />
        </Modal>
      )}
      {anularRec && (
        <AnularModal
          entityLabel={anularRec?.isGroup ? "Orden de Compra" : "Compra"}
          record={anularRec?.isGroup ? { id: anularRec.id } : anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function Stock({ data, onNavigate }) {
  const { productos, movimientosStock = [] } = data;
  const movimientos = [...movimientosStock]
    .sort((a, b) => {
      if ((b.fecha || "") !== (a.fecha || "")) return (b.fecha || "").localeCompare(a.fecha || "");
      if ((b.refId || "") !== (a.refId || "")) return (b.refId || "").localeCompare(a.refId || "");
      return (b.id || "").localeCompare(a.id || "");
    })
    .slice(0, 120);

  const goToMovimiento = (m) => {
    if (!onNavigate) return;
    if (m.origen === "compra") onNavigate("compras", m.refId);
    if (m.origen === "remito") onNavigate("remitos", m.refId);
  };

  return (
    <div>
      <PageHdr title="Control de Stock" sub="Entradas/salidas valorizadas con costo promedio ponderado (CPP)" />
      <Card>
        <table className="w-full text-sm">
          <THead cols={["Producto","Tipo","Entradas","Salidas","Stock Actual","CPP USD","Valor Stock USD","Ult. costo compra","Precio Venta","Estado","Alerta"]} />
          <tbody>
            {productos.map(p => {
              const ent = num(p.totalEntradas);
              const sal = num(p.totalSalidas);
              const stock = num(p.stockActual);
              const cpp = num(p.costoPromedio) || num(p.costo) || 0;
              const valorStock = num(p.valorStock) || (stock * cpp);
              const ultimoCosto = num(p.ultimoCosto) || cpp;
              const st = stockStatus(stock);
              return (
                <TR key={p.id}>
                  <TD bold>{p.nombre}</TD><TD gray>{p.tipo}</TD>
                  <TD right green>+{fmt(ent, 2)}</TD><TD right red>-{fmt(sal, 2)}</TD>
                  <TD right bold>{fmt(stock, 2)}</TD>
                  <TD right>USD {fmt(cpp)}</TD>
                  <TD right bold>USD {fmt(valorStock)}</TD>
                  <TD right gray>USD {fmt(ultimoCosto)}</TD>
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
          <h2 className="font-bold text-gray-700 text-sm">Historial de Movimientos de Stock (auditable)</h2>
          <span className="text-xs text-gray-400">{movimientos.length} movimientos</span>
        </div>
        <table className="w-full text-sm">
          <THead cols={["Fecha", "Tipo", "Producto", "Cantidad", "Costo Unit USD", "CPP Antes", "CPP Despues", "Stock Antes", "Stock Despues", "Referencia", ""]} />
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
                <TD bold green={m.tipo === "entrada"} red={m.tipo === "salida"}>{m.tipo === "entrada" ? "+" : "-"}{fmt(num(m.cantidad), 2)}</TD>
                <TD right>USD {fmt(num(m.costoUnitario))}</TD>
                <TD right>{fmt(num(m.costoPromedioAntes))}</TD>
                <TD right>{fmt(num(m.costoPromedioDespues))}</TD>
                <TD right>{fmt(num(m.stockAntes), 2)}</TD>
                <TD right>{fmt(num(m.stockDespues), 2)}</TD>
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
            {!movimientos.length && <EmptyRow cols={11} />}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── COSTOS ───────────────────────────────────────────────────────────────────
function Costos({ data, onUpdate, currentUser }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [anularRec, setAnularRec] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
  const { costos, cotizaciones } = data;
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => {
    setEditId(null);
    const tcInfo = construirTC(cotizaciones, today());
    setForm({ fecha: today(), concepto: "", monto: "", moneda: "PESOS", medioPago: "", tipoCosto: "Variable", categoria: "", area: "Comercial", obs: "", ...tcInfo });
    setModal(true);
  };
  const openEdit = (c) => { setEditId(c.id); setForm({ ...c }); setModal(true); };
  const handleAnular = (motivo) => {
    onUpdate("costos", aplicarAnulacion(costos, anularRec.id, motivo, currentUser));
    setAnularRec(null);
  };
  const save = () => {
    if (!form.fecha || !form.concepto || !form.monto) return alert("Completa Fecha, Concepto y Monto.");
    const rec = { ...form, monto: +form.monto, tc: +form.tc || 1 };
    if (editId) { rec.id = editId; onUpdate("costos", costos.map(c => c.id === editId ? rec : c)); }
    else { const n = data.cnt.cos + 1; rec.id = `C-${pad4(n)}`; onUpdate("costos", [...costos, rec]); onUpdate("cnt", { ...data.cnt, cos: n }); }
    setModal(false);
  };
  const totalUSD = costos.filter(c => !c.anulado).reduce((s,c) => s + (c.moneda==="PESOS" ? num(c.monto)/(num(c.tc)||1) : num(c.monto)), 0);
  const filteredCostos = costos.filter((c) => inDateRange(c.fecha, dateRange) && (showAnulados || !c.anulado));
  return (
    <div>
      <PageHdr title="Registro de Costos" sub="Gastos fijos y variables" onNew={openNew} btn="+ Nuevo Costo" />
      <div className="mb-4"><KPI label="Total Costos" value={`USD ${fmt(totalUSD)}`} sub="todos los registros" color="red" icon="costs" /></div>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <DateRangeFilter range={dateRange} onChange={setDateRange} count={filteredCostos.length} total={costos.length} />
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
      </div>
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID","Fecha","Concepto","Monto","Moneda","USD equiv.","Tipo","Categoria","Area",""]} />
          <tbody>
            {filteredCostos.map(c => {
              const usd = c.moneda==="PESOS" ? num(c.monto)/(num(c.tc)||1) : num(c.monto);
              const an = c.anulado;
              return (
                <TR key={c.id} className={an ? "opacity-50 line-through" : ""}>
                  <TD mono gray>{c.id}</TD><TD>{fmtD(c.fecha)}</TD><TD bold>{c.concepto}</TD>
                  <TD right>{fmt(c.monto,0)}</TD>
                  <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.moneda==="DOLAR"?"bg-emerald-100 text-emerald-700":"bg-blue-100 text-blue-700"}`}>{c.moneda}</span></td>
                  <TD right gray>USD {fmt(usd)}</TD><TD gray>{c.tipoCosto}</TD><TD gray>{c.categoria}</TD><TD gray>{c.area}</TD>
                  <Btns anulado={an} onEdit={()=>openEdit(c)} onAnular={()=>setAnularRec(c)} />
                </TR>
              );
            })}
            {!filteredCostos.length && <EmptyRow cols={10} />}
          </tbody>
        </table>
      </Card>
      {modal && (
        <Modal title={editId?"Editar Costo":"Nuevo Costo"} wide onClose={()=>setModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha||""} onChange={e=>sf("fecha",e.target.value)} /></Fl>
            <Fl label="Concepto *"><input type="text" className={IC} value={form.concepto||""} onChange={e=>sf("concepto",e.target.value)} /></Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={IC} value={form.monto||""} onChange={e=>sf("monto",e.target.value)} /></Fl>
            <Fl label="Moneda"><select className={IC} value={form.moneda||"PESOS"} onChange={e=>sf("moneda",e.target.value)}><option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option></select></Fl>
            <Fl label={`Tipo de Cambio${form.tcFuente ? ` (${form.tcFuente})` : ""}`}>
              <input type="number" step="0.01" className={IC}
                value={form.tc||""}
                onChange={e=>sf("tc",e.target.value)}
                onFocus={() => { if (form.tcFuente && form.tcFuente !== "manual") sf("tcFuente", "manual"); }} />
            </Fl>
            <Fl label="Medio de Pago"><select className={IC} value={form.medioPago||""} onChange={e=>sf("medioPago",e.target.value)}><option value="">Seleccionar...</option>{MEDIOS_PAGO_OPTIONS.map((m)=><option key={m.value} value={m.value}>{m.label}</option>)}</select></Fl>
            <Fl label="Tipo"><select className={IC} value={form.tipoCosto||"Variable"} onChange={e=>sf("tipoCosto",e.target.value)}><option>Fijo</option><option>Variable</option></select></Fl>
            <Fl label="Categoria"><select className={IC} value={form.categoria||""} onChange={e=>sf("categoria",e.target.value)}><option value="">Seleccionar...</option>{["Fletes","Sueldos","Comisiones","Combustible","Mantenimiento","Impuestos","Alquileres","Otros"].map(m=><option key={m}>{m}</option>)}</select></Fl>
            <Fl label="Area"><select className={IC} value={form.area||"Comercial"} onChange={e=>sf("area",e.target.value)}><option>Comercial</option><option>Administrativa</option><option>Operaciones</option></select></Fl>
            <Fl label="Observaciones"><input type="text" className={IC} value={form.obs||""} onChange={e=>sf("obs",e.target.value)} /></Fl>
          </div>
          <FBtns onSave={save} onCancel={()=>setModal(false)} />
        </Modal>
      )}
      {anularRec && (
        <AnularModal
          entityLabel="Costo"
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}

// ─── MAESTROS ─────────────────────────────────────────────────────────────────
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
  const editableFields = fields.filter((f) => !f.readOnly);
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
            {editableFields.map(f => (
              <Fl key={f.key} label={f.label}>
                {f.type === "select" ? (
                  <SearchSelect
                    value={form[f.key] ?? ""}
                    placeholder="Seleccionar..."
                    clearable
                    clearLabel="Seleccionar..."
                    options={(f.options || []).map((opt) => ({
                      value: String(opt.value),
                      label: opt.label,
                      searchText: `${opt.label} ${opt.value}`,
                    }))}
                    onChange={(next) => setForm((x) => ({ ...x, [f.key]: parseInputValue(f, String(next || "")) }))}
                  />
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
      if (col === "productos") {
        nextRec.iva = ivaPct(nextRec.iva);
        nextRec.unidadMedida = normalizeUnidadMedida(nextRec.unidadMedida);
      }
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
          {
            key: "unidadMedida",
            label: "Unidad",
            type: "select",
            options: PRODUCT_UNIT_OPTIONS.map((u) => ({ value: u.value, label: u.label })),
            render: (value) => PRODUCT_UNIT_OPTIONS.find((u) => u.value === normalizeUnidadMedida(value))?.label || "Unidades (u.)",
          },
          {
            key: "stockActual",
            label: "Stock Actual",
            readOnly: true,
            render: (v, item) => `${fmt(num(v), 2)} ${unidadMedidaShort(item?.unidadMedida)}`,
          },
          { key: "costoPromedio", label: "CPP USD", readOnly: true, render: (v) => `USD ${fmt(num(v))}` },
          { key: "ultimoCosto", label: "Ult. costo compra USD", readOnly: true, render: (v) => `USD ${fmt(num(v))}` },
          { key: "valorStock", label: "Valor Stock USD", readOnly: true, render: (v) => `USD ${fmt(num(v))}` },
          { key: "costo", label: "Costo Base USD", type: "number", step: "0.01" },
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
      <MaestroCRUD
        title="Vendedores"
        items={data.vendedores}
        fields={[
          { key: "nombre", label: "Nombre" },
          { key: "objetivoUSD", label: "Objetivo mensual (USD)", type: "number", step: "100" },
        ]}
        {...mk("vendedores", "vend")}
      />
    </div>
  );
}

// ─── OCR ──────────────────────────────────────────────────────────────────────
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
    factura: `Analiza esta factura y devuelve SOLO JSON sin texto extra:\n{"numeroFactura":"","fecha":"YYYY-MM-DD","proveedor":"nombre","producto":"descripcion","cantidad":0,"precioUnitario":0,"total":0,"observaciones":""}`,
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
      onUpdate("compras", [...data.compras, { id: `OC_${pad4(n)}`, fecha: extracted.fecha || today(), proveedorId: prov?.id || "", productoId: prod?.id || "", cantidad: +extracted.cantidad || 0, precio: +extracted.precioUnitario || 0, ivaPct: ivaPct(prod?.iva), moneda: extracted.moneda || "USD", entregaEst: "", recepcion: "", cantRecibida: 0, cantFacturada: 0, fechaFacturaProv: "", pagado: 0, pagadoUSD: 0, medioPago: "" }]);
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
        numeroFactura: String(extracted.numeroFactura || "").trim(),
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardHeader({ query, onQuery, userName = "Admin", roleName = "ADMIN" }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[#E5ECE7] shadow-sm px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#17211B]">Dashboard Ejecutivo</h1>
        <p className="text-sm text-[#6B7280] mt-1">Resumen operativo y financiero del negocio</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar cliente, operacion o alerta..."
            className="w-full sm:w-72 rounded-2xl border border-[#DDE8E0] bg-[#F6F8F5] pl-9 pr-3 py-2 text-sm text-[#17211B] focus:outline-none focus:ring-2 focus:ring-[#1F7A4D]"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-[#F6F8F5] border border-[#E5ECE7] rounded-2xl px-3 py-2">
          <CalendarDays className="w-4 h-4 text-[#1F7A4D]" />
          {formatLongDateAr(now)}
        </div>
        <div className="flex items-center gap-2 bg-[#14532D] text-white rounded-2xl px-3 py-2">
          <UserCircle2 className="w-4 h-4" />
          <div className="leading-tight">
            <p className="text-xs font-semibold">{userName}</p>
            <p className="text-[10px] text-emerald-100/90">{roleName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardKPICard({ title, value, subtitle, tone = "green", Icon }) {
  const toneMap = {
    green: "bg-[#DFF5E8] text-[#1F7A4D] border-[#BEE7CF]",
    dark: "bg-[#E8F0EA] text-[#14532D] border-[#CFE2D6]",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const toneCls = toneMap[tone] || toneMap.green;
  return (
    <div className="bg-white rounded-2xl border border-[#E5ECE7] shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">{title}</p>
          <p className="text-2xl font-bold text-[#17211B] mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs text-[#6B7280] mt-3">{subtitle}</p>
    </div>
  );
}

function AlertCard({ title, description, severity = "warn" }) {
  const severityMap = {
    success: {
      cls: "bg-[#ECFDF3] border-[#B7EBC7] text-[#166534]",
      Icon: CheckCircle2,
    },
    warn: {
      cls: "bg-amber-50 border-amber-200 text-amber-700",
      Icon: AlertTriangle,
    },
    error: {
      cls: "bg-red-50 border-red-200 text-red-700",
      Icon: AlertTriangle,
    },
  };
  const cfg = severityMap[severity] || severityMap.warn;
  const Icon = cfg.Icon;
  return (
    <div className={`rounded-2xl border p-3 ${cfg.cls}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs opacity-90 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}

const DASH_STATUS_CLS = {
  Cobrado: "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Vencido: "bg-red-50 text-red-700 border-red-200",
  Remitado: "bg-blue-50 text-blue-700 border-blue-200",
  "Sin remito": "bg-violet-50 text-violet-700 border-violet-200",
};

function OperationsTable({ rows, onOpen }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5ECE7]">
        <h2 className="font-bold text-[#17211B] text-sm">Ultimas operaciones</h2>
      </div>
      <table className="w-full text-sm">
        <THead cols={["Fecha", "Cliente", "Tipo", "Estado", "Importe", "Accion"]} />
        <tbody>
          {rows.map((row) => (
            <TR key={row.id}>
              <TD>{fmtD(row.fecha)}</TD>
              <TD bold>{row.cliente}</TD>
              <TD>{row.tipo}</TD>
              <td className="px-4 py-2.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${DASH_STATUS_CLS[row.estado] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {row.estado}
                </span>
              </td>
              <TD right bold>USD {fmt(row.importe)}</TD>
              <td className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onOpen?.(row)}
                  className="px-3 py-1.5 rounded-xl border border-[#BEE7CF] bg-[#DFF5E8] text-[#14532D] text-xs font-semibold hover:bg-[#CBEFD9]"
                >
                  Ver
                </button>
              </td>
            </TR>
          ))}
          {!rows.length && <EmptyRow cols={6} />}
        </tbody>
      </table>
    </Card>
  );
}

// ─── TACÓMETRO (GAUGE) ───────────────────────────────────────────────────────
function GaugeChart({ value, max }) {
  const v = Math.max(0, num(value));
  const m = Math.max(1, num(max));
  const pct = v / m;
  const filled = Math.min(pct, 1);
  const length = Math.PI * 80;
  const dash = length * filled;
  const color = pct >= 1 ? "#059669" : pct >= 0.8 ? "#22C55E" : pct >= 0.5 ? "#F59E0B" : "#EF4444";
  const exceeded = pct > 1;

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 130" className="w-full max-w-md mx-auto">
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#E5E7EB" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${dash} ${length}`} style={{ transition: "stroke-dasharray 0.6s ease-out" }} />
        <text x={100} y={92} textAnchor="middle" fontSize="32" fontWeight="800" fill={color}>{Math.round(pct * 100)}%</text>
        <text x={100} y={114} textAnchor="middle" fontSize="11" fontWeight="600" fill="#9CA3AF">{exceeded ? "OBJETIVO SUPERADO" : "DEL OBJETIVO"}</text>
      </svg>
      <div className="mt-2 flex justify-center gap-6 text-sm">
        <div>
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">Vendido</p>
          <p className="font-bold text-[#17211B] text-lg">USD {fmt(v)}</p>
        </div>
        <div className="border-l border-gray-200 pl-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">Objetivo</p>
          <p className="font-bold text-[#6B7280] text-lg">USD {fmt(m)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD DEL VENDEDOR ─────────────────────────────────────────────────
function DashboardVendedor({ data, jwtUser }) {
  const { facturas = [], operaciones = [], clientes = [], productos = [], vendedores = [] } = data;
  const facturasActivas = filterActive(facturas);
  const operacionesActivas = filterActive(operaciones);

  const myVendedor = vendedores.find((v) =>
    String(v.nombre || "").toLowerCase().trim() === String(jwtUser?.nombre || "").toLowerCase().trim()
  );
  const myId = myVendedor?.id;
  const objetivo = num(myVendedor?.objetivoUSD) || 0;

  const todayDate = new Date();
  const month = todayDate.getMonth();
  const year = todayDate.getFullYear();
  const isSameMonth = (val) => {
    const d = new Date(`${String(val || "").slice(0, 10)}T00:00:00`);
    return !isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() === year;
  };

  const myFacturas = facturasActivas.filter((f) => +f.vendedorId === +myId);
  const myFacturasMes = myFacturas.filter((f) => isSameMonth(f.fecha));
  const ventasMes = myFacturasMes.reduce((s, f) => s + num(f.cantidad) * num(f.precioUnit), 0);

  const myOps = operacionesActivas.filter((o) => +o.vendedorId === +myId);
  const opsMes = new Set(myOps.filter((o) => isSameMonth(o.fecha)).map((o) => o.opBaseId || o.id)).size;
  const clientesMes = new Set(myFacturasMes.map((f) => f.clienteId)).size;

  const recientes = [...myFacturas]
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
    .slice(0, 8);

  const mesNombre = todayDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#17211B]">Hola, {jwtUser?.nombre || "Vendedor"}</h1>
        <p className="text-sm text-[#6B7280] mt-0.5 capitalize">{mesNombre} — tu objetivo y avance</p>
      </div>

      {!myVendedor && (
        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800 font-bold">Tu usuario no está vinculado a un vendedor</p>
          <p className="text-xs text-amber-700 mt-1.5">
            Pedile al administrador que cree un registro de vendedor en <strong>Maestros → Vendedores</strong> con el mismo nombre que tu usuario:
            <strong> "{jwtUser?.nombre}"</strong>.
          </p>
        </Card>
      )}

      {myVendedor && (
        <>
          <Card className="p-6">
            <h2 className="text-base font-bold text-[#17211B] mb-1">Objetivo del mes</h2>
            <p className="text-xs text-[#6B7280] mb-4">Tu progreso de ventas vs el objetivo asignado</p>
            {objetivo > 0 ? (
              <GaugeChart value={ventasMes} max={objetivo} />
            ) : (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-[#6B7280]">El administrador todavía no asignó un objetivo.</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Pedile que lo configure en Maestros → Vendedores.</p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Vendido este mes</p>
              <p className="text-2xl font-bold text-[#17211B] mt-1">USD {fmt(ventasMes)}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{myFacturasMes.length} factura{myFacturasMes.length !== 1 ? "s" : ""}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Operaciones</p>
              <p className="text-2xl font-bold text-[#17211B] mt-1">{opsMes}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">cargadas en el mes</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Clientes activos</p>
              <p className="text-2xl font-bold text-[#17211B] mt-1">{clientesMes}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">facturados este mes</p>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-[#E5ECE7]">
              <h2 className="font-bold text-[#17211B] text-sm">Mis últimas facturas</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Producto</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Importe</th>
                </tr>
              </thead>
              <tbody>
                {recientes.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">Aún no tenés facturas cargadas.</td></tr>
                ) : recientes.map((f) => (
                  <tr key={f.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAF8]">
                    <td className="px-5 py-3 text-[#6B7280] text-xs whitespace-nowrap">{fmtD(f.fecha)}</td>
                    <td className="px-5 py-3 font-medium text-[#17211B]">{lookupNombre(clientes, f.clienteId)}</td>
                    <td className="px-5 py-3 text-[#6B7280]">{lookupNombre(productos, f.productoId)}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#17211B] whitespace-nowrap">USD {fmt(num(f.cantidad) * num(f.precioUnit))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function Dashboard({ data, onNavigate, currentUser }) {
  const [query, setQuery] = useState("");
  const { operaciones, facturas, remitos, recibos, productos, movimientosStock = [], cheques = [] } = data;
  const operacionesActivas = filterActive(operaciones);
  const facturasActivas = filterActive(facturas);
  const remitosActivos = filterActive(remitos);
  const recibosActivos = filterActive(recibos);
  const chequesActivos = filterActive(cheques);
  const todayDate = new Date();
  const parseDate = (value) => {
    const raw = String(value || "").slice(0, 10);
    if (!raw) return null;
    const d = new Date(`${raw}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const isSameMonth = (value) => {
    const d = parseDate(value);
    return !!d && d.getMonth() === todayDate.getMonth() && d.getFullYear() === todayDate.getFullYear();
  };

  const opMap = new Map();
  const opGroups = [];
  for (const op of operacionesActivas) {
    const key = op.opBaseId || opBaseId(op.id);
    if (!opMap.has(key)) {
      const g = { id: key, lines: [] };
      opMap.set(key, g);
      opGroups.push(g);
    }
    opMap.get(key).lines.push(op);
  }

  const opRows = opGroups.map((g) => {
    g.lines.sort((a, b) => num(a.opLine) - num(b.opLine));
    const head = g.lines[0];
    const tracks = g.lines.reduce((acc, op) => {
      const t = opTracks(op, facturasActivas, remitosActivos, recibosActivos, productos);
      acc.comprometido += t.comprometido;
      acc.remitado += t.remitado;
      acc.facturado += t.facturado;
      acc.pendEntrega += t.pendEntrega;
      acc.pendCobrar += t.pendCobrar;
      return acc;
    }, {
      comprometido: 0,
      remitado: 0,
      facturado: 0,
      pendEntrega: 0,
      pendCobrar: 0,
    });
    const pendRemitoFact = Math.max(0, tracks.remitado - tracks.facturado);
    const lineFacturas = facturasActivas.filter((f) => g.lines.some((op) => op.id === f.opId));
    const hasVencido = lineFacturas.some((f) => {
      const due = parseDate(f.fechaCobro);
      const saldo = facSaldo(f, recibosActivos, productos, facturasActivas);
      return due && due < todayDate && saldo > 0.01;
    });
    let estado = "Cobrado";
    if (tracks.pendEntrega > 0.01) estado = "Sin remito";
    else if (pendRemitoFact > 0.01) estado = "Remitado";
    else if (tracks.pendCobrar > 0.01) estado = hasVencido ? "Vencido" : "Pendiente";

    return {
      id: g.id,
      fecha: head.fecha,
      cliente: lookupNombre(data.clientes, head.clienteId),
      tipo: "Venta",
      estado,
      importe: g.lines.reduce((s, op) => s + opTotalUSD(op, productos), 0),
      opId: head.id,
      pendRemitoFact,
      pendEntrega: tracks.pendEntrega,
    };
  });

  const ventasMesUSD = facturasActivas
    .filter((f) => isSameMonth(f.fecha))
    .reduce((s, f) => s + facTotal(f, productos), 0);

  const facturaPendByBase = new Map();
  for (const f of facturasActivas) {
    const base = facturaBaseId(f);
    const saldo = facSaldo(f, recibosActivos, productos, facturasActivas);
    facturaPendByBase.set(base, num(facturaPendByBase.get(base)) + saldo);
  }
  const facturasPend = Array.from(facturaPendByBase.entries()).filter(([, saldo]) => saldo > 0.01);
  const cobrosPendientesUSD = facturasPend.reduce((s, [, saldo]) => s + saldo, 0);
  const facturasPendCount = facturasPend.length;

  const facturasMesCount = new Set(
    facturasActivas
      .filter((f) => isSameMonth(f.fecha))
      .map((f) => facturaBaseId(f)),
  ).size;

  const remitosPendOps = opRows.filter((r) => r.pendRemitoFact > 0.01);
  const remitosPendCount = remitosPendOps.length;
  const remitosPendUnits = remitosPendOps.reduce((s, r) => s + r.pendRemitoFact, 0);

  const stockValorizadoUSD = productos.reduce((s, p) => {
    const stock = Math.max(0, num(p.stockActual));
    const unitCost = num(p.costoPromedio) || num(p.costo) || num(p.precio);
    return s + stock * unitCost;
  }, 0);

  const costoVentasMesUSD = movimientosStock
    .filter((m) => m.tipo === "salida" && isSameMonth(m.fecha))
    .reduce((s, m) => s + num(m.valorMovimientoUSD), 0);
  const margenEstimadoPct = ventasMesUSD > 0 ? ((ventasMesUSD - costoVentasMesUSD) / ventasMesUSD) * 100 : 0;

  const salesByMonth = lastMonthKeys(6).reverse().map((key) => ({
    key,
    label: monthLabelEs(key),
    total: facturasActivas
      .filter((f) => monthKeyFromDate(f.fecha) === key)
      .reduce((s, f) => s + facTotal(f, productos), 0),
  }));
  const maxSalesMonth = salesByMonth.reduce((mx, m) => Math.max(mx, m.total), 1);

  const cobranzasMesUSD = recibosActivos
    .filter((r) => isSameMonth(r.fecha))
    .reduce((s, r) => s + reciboUSD(r), 0);
  const coberturaCobranzaPct = (cobranzasMesUSD + cobrosPendientesUSD) > 0
    ? (cobranzasMesUSD / (cobranzasMesUSD + cobrosPendientesUSD)) * 100
    : 0;
  const chequeFlow30 = calcChequeCashflow(chequesActivos, 30);

  const stockByCategory = Array.from(
    productos.reduce((map, p) => {
      const cat = p.tipo || "General";
      const stock = num(p.stockActual);
      const prev = map.get(cat) || { categoria: cat, unidades: 0, criticos: 0, valorUSD: 0 };
      const stockPos = Math.max(0, stock);
      const cpp = num(p.costoPromedio) || num(p.costo) || num(p.precio);
      prev.unidades += stockPos;
      prev.criticos += stock <= 20 ? 1 : 0;
      prev.valorUSD += stockPos * cpp;
      map.set(cat, prev);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => b.valorUSD - a.valorUSD);

  const facturasVencidas = facturasActivas.filter((f) => {
    const due = parseDate(f.fechaCobro);
    return due && due < todayDate && facSaldo(f, recibosActivos, productos, facturasActivas) > 0.01;
  });
  const clientesDeudaVencida = new Set(
    facturasVencidas.map((f) => {
      if (hasValue(f.clienteId)) return +f.clienteId;
      const op = operacionesActivas.find((o) => o.id === f.opId);
      return op?.clienteId;
    }).filter(Boolean),
  ).size;
  const operacionesIncompletas = opRows.filter((r) => r.estado !== "Cobrado").length;
  const stockCriticoCount = productos.filter((p) => num(p.stockActual) <= 20).length;
  const pedidosSinRemito = opRows.filter((r) => r.pendEntrega > 0.01).length;

  const alerts = [
    {
      id: "a1",
      title: "Facturas sin cobrar",
      description: `${facturasPendCount} facturas por USD ${fmt(cobrosPendientesUSD)}.`,
      severity: facturasPendCount > 0 ? "warn" : "success",
    },
    {
      id: "a2",
      title: "Pedidos sin remito",
      description: `${pedidosSinRemito} operaciones con entrega pendiente.`,
      severity: pedidosSinRemito > 0 ? "error" : "success",
    },
    {
      id: "a3",
      title: "Productos con stock bajo",
      description: `${stockCriticoCount} productos requieren reposicion.`,
      severity: stockCriticoCount > 0 ? "warn" : "success",
    },
    {
      id: "a4",
      title: "Clientes con deuda vencida",
      description: `${clientesDeudaVencida} clientes con factura vencida.`,
      severity: clientesDeudaVencida > 0 ? "error" : "success",
    },
    {
      id: "a5",
      title: "Operaciones incompletas",
      description: `${operacionesIncompletas} operaciones requieren seguimiento.`,
      severity: operacionesIncompletas > 0 ? "warn" : "success",
    },
  ];

  const q = query.trim().toLowerCase();
  const visibleAlerts = alerts.filter((a) => !q || `${a.title} ${a.description}`.toLowerCase().includes(q));
  const latestRows = [...opRows]
    .filter((r) => !q || `${r.id} ${r.cliente} ${r.tipo} ${r.estado}`.toLowerCase().includes(q))
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <DashboardHeader
        query={query}
        onQuery={setQuery}
        userName={currentUser?.nombre || "Admin"}
        roleName={String(currentUser?.rol || "admin").toUpperCase()}
      />

      <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
        <DashboardKPICard
          title="Ventas del mes"
          value={`USD ${fmt(ventasMesUSD)}`}
          subtitle="Facturacion total del mes actual."
          tone="green"
          Icon={DollarSign}
        />
        <DashboardKPICard
          title="Cobros pendientes"
          value={`USD ${fmt(cobrosPendientesUSD)}`}
          subtitle={`${facturasPendCount} facturas con saldo pendiente.`}
          tone={cobrosPendientesUSD > 0 ? "amber" : "dark"}
          Icon={CircleDollarSign}
        />
        <DashboardKPICard
          title="Facturas emitidas"
          value={facturasMesCount}
          subtitle="Facturas base emitidas este mes."
          tone="blue"
          Icon={FileText}
        />
        <DashboardKPICard
          title="Remitos pendientes"
          value={remitosPendCount}
          subtitle={`${fmt(remitosPendUnits, 0)} u. entregadas pendientes de facturar.`}
          tone={remitosPendCount > 0 ? "amber" : "dark"}
          Icon={Truck}
        />
        <DashboardKPICard
          title="Stock valorizado"
          value={`USD ${fmt(stockValorizadoUSD)}`}
          subtitle="Valorizado a costo promedio ponderado vigente."
          tone="dark"
          Icon={Boxes}
        />
        <DashboardKPICard
          title="Margen estimado"
          value={`${fmt(margenEstimadoPct, 1)}%`}
          subtitle={`CMV del mes (por remitos): USD ${fmt(costoVentasMesUSD)}.`}
          tone={margenEstimadoPct >= 0 ? "green" : "red"}
          Icon={TrendingUp}
        />
        <DashboardKPICard
          title="Flujo cheques (30d)"
          value={`USD ${fmt(chequeFlow30.neto)}`}
          subtitle={`Ingresos ${chequeFlow30.ingresosCount} / Salidas ${chequeFlow30.salidasCount} por vencimiento.`}
          tone={chequeFlow30.neto >= 0 ? "green" : "red"}
          Icon={CalendarDays}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-[#17211B] text-sm">Ventas por mes</h2>
              <p className="text-xs text-[#6B7280] mt-1">Vista rapida de evolucion comercial (ultimos 6 meses).</p>
            </div>
            <BarChart3 className="w-5 h-5 text-[#1F7A4D]" />
          </div>
          <div className="h-52 flex items-end gap-2">
            {salesByMonth.map((m) => (
              <div key={m.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
                <div className="w-full h-36 bg-[#EDF3EE] rounded-2xl flex items-end p-1">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-[#14532D] to-[#1F7A4D]"
                    style={{ height: `${Math.max(8, pct(m.total, maxSalesMonth))}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#6B7280]">{m.label}</p>
                <p className="text-[11px] font-semibold text-[#17211B]">USD {fmt(m.total, 0)}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[#17211B] text-sm">Resumen de cobranzas</h2>
                <p className="text-xs text-[#6B7280] mt-1">Cobrado vs saldo pendiente.</p>
              </div>
              <Activity className="w-5 h-5 text-[#1F7A4D]" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Cobrado en el mes</p>
                <p className="text-xl font-bold text-[#14532D]">USD {fmt(cobranzasMesUSD)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Pendiente total</p>
                <p className="text-xl font-bold text-amber-700">USD {fmt(cobrosPendientesUSD)}</p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[#6B7280] mb-1">
                  <span>Cobertura</span>
                  <span>{fmt(coberturaCobranzaPct, 1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#E6EEE8] overflow-hidden">
                  <div className="h-full rounded-full bg-[#1F7A4D]" style={{ width: `${pct(coberturaCobranzaPct, 100)}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-[#17211B] text-sm">Stock por categoria</h2>
                <p className="text-xs text-[#6B7280] mt-1">Estado rapido por linea de producto.</p>
              </div>
              <ClipboardList className="w-5 h-5 text-[#1F7A4D]" />
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {stockByCategory.map((cat) => (
                <div key={cat.categoria} className="rounded-xl border border-[#E5ECE7] bg-[#F9FBF9] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#17211B]">{cat.categoria}</p>
                    <p className="text-xs text-[#6B7280]">USD {fmt(cat.valorUSD, 0)}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#6B7280]">
                    <span>{fmt(cat.unidades, 0)} u.</span>
                    <span className={cat.criticos > 0 ? "text-amber-700 font-semibold" : "text-emerald-700 font-semibold"}>{cat.criticos} criticos</span>
                  </div>
                </div>
              ))}
              {!stockByCategory.length && <p className="text-sm text-[#6B7280]">Sin datos de stock.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#17211B] text-sm">Alertas inteligentes</h2>
          <FileClock className="w-5 h-5 text-[#1F7A4D]" />
        </div>
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3">
          {visibleAlerts.map((a) => (
            <AlertCard key={a.id} title={a.title} description={a.description} severity={a.severity} />
          ))}
          {!visibleAlerts.length && (
            <div className="col-span-full rounded-xl border border-[#E5ECE7] bg-[#F9FBF9] p-4 text-sm text-[#6B7280]">
              No se encontraron alertas para la busqueda actual.
            </div>
          )}
        </div>
      </Card>

      <OperationsTable
        rows={latestRows}
        onOpen={(row) => {
          if (onNavigate) onNavigate("operaciones", row.opId);
        }}
      />
    </div>
  );
}
// ─── APP ──────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard", page: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "principal" },
  { id: "operaciones", page: "operaciones", label: "Operaciones", icon: Briefcase, group: "principal" },
  { id: "facturacion", page: "facturacion", label: "Facturacion", icon: FileText, group: "principal" },
  { id: "remitos", page: "remitos", label: "Remitos", icon: Truck, group: "principal" },
  { id: "recibos", page: "recibos", label: "Recibos / Cobros", icon: ReceiptText, group: "principal" },
  { id: "notascredito", page: "notascredito", label: "Notas de Crédito", icon: BookMinus, group: "principal" },
  { id: "notasdebito", page: "notasdebito", label: "Notas de Débito", icon: BookPlus, group: "principal" },
  { id: "estadocuenta", page: "estadocuenta", label: "Estado de Cuenta", icon: ListOrdered, group: "principal" },
  { id: "stock", page: "stock", label: "Stock", icon: Boxes, group: "principal" },
  { id: "clientes", page: "maestros", label: "Clientes", icon: Users, group: "principal" },
  { id: "productos", page: "maestros", label: "Productos", icon: Package, group: "principal" },
  { id: "reportes", page: "dashboard", label: "Reportes", icon: BarChart3, group: "principal" },
  { id: "compras", page: "compras", label: "Compras", icon: ShoppingCart, group: "extra" },
  { id: "costos", page: "costos", label: "Costos", icon: Landmark, group: "extra" },
  { id: "ocr", page: "ocr", label: "Carga OCR", icon: ScanText, group: "extra" },
  { id: "cotizaciones", page: "cotizaciones", label: "Cotizaciones", icon: Banknote, group: "extra" },
  { id: "cheques", page: "cheques", label: "Cartera Cheques", icon: CalendarDays, group: "extra" },
  { id: "usuarios", page: "usuarios", label: "Usuarios", icon: UserCog, group: "extra" },
  { id: "auditoria", page: "auditoria", label: "Auditoría", icon: History, group: "extra" },
];

const ROLE_LABELS = {
  admin: "ADMIN",
  vendedor: "VENDEDOR",
};

const ROLE_PAGE_ACCESS = {
  admin: new Set(["dashboard", "operaciones", "facturacion", "remitos", "recibos", "notascredito", "notasdebito", "estadocuenta", "stock", "compras", "costos", "ocr", "maestros", "usuarios", "auditoria", "cotizaciones", "cheques"]),
  vendedor: new Set(["dashboard", "operaciones", "facturacion", "remitos", "recibos", "notascredito", "notasdebito", "estadocuenta", "stock"]),
};

const ROLE_NAV_HIDDEN = {
  vendedor: new Set(["clientes", "productos", "reportes", "compras", "costos", "ocr", "usuarios", "auditoria", "notascredito", "notasdebito", "cotizaciones", "cheques"]),
};

const canAccessPage = (role, page) => (ROLE_PAGE_ACCESS[role] || ROLE_PAGE_ACCESS.vendedor).has(page);
const canSeeNavItem = (role, item) => !(ROLE_NAV_HIDDEN[role] || new Set()).has(item.id) && canAccessPage(role, item.page);

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

// ─── TOKEN DE SESIÓN ─────────────────────────────────────────────────────────
let _authToken = typeof window !== "undefined" ? (localStorage.getItem("erp-token") || null) : null;
function getToken() { return _authToken; }
function setToken(t) {
  _authToken = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("erp-token", t);
    else localStorage.removeItem("erp-token");
  }
}
const EXPORT_TABLES = [
  "operaciones",
  "facturas",
  "remitos",
  "recibos",
  "compras",
  "remitosCompra",
  "facturasCompra",
  "recibosCompra",
  "clientes",
  "proveedores",
  "productos",
  "vendedores",
  "costos",
  "movimientosStock",
  "cheques",
];

const buildApiBases = () => {
  const bases = [];
  if (API_BASE) bases.push(API_BASE);

  if (typeof window === "undefined") {
    bases.push("http://localhost:4000");
  } else if (window.location.protocol === "file:") {
    bases.push("http://localhost:4000");
  } else {
    // URL relativa (mismo origen): funciona en producción y con proxy de Vite
    bases.push("");
    // Fallback explícito al puerto 4000 (cuando frontend y backend están separados en dev)
    const explicit = `${window.location.protocol}//${window.location.hostname || "localhost"}:4000`;
    if (!bases.includes(explicit)) bases.push(explicit);
  }

  // Mantenemos "" (URL relativa) — antes se eliminaba por filter(Boolean)
  return Array.from(new Set(bases.filter((b) => b !== null && b !== undefined)));
};

const apiUrl = (path, base = API_BASE) => `${base}${path}`;

async function fetchApi(path, options = {}) {
  const bases = buildApiBases();
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let lastErr = null;
  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    try {
      const res = await fetch(apiUrl(path, base), { ...options, headers });
      const hasNext = i < bases.length - 1;
      const fromConfiguredBase = Boolean(API_BASE) && base === API_BASE;
      // Si una API base configurada (externa) cae en 5xx, probamos las bases
      // locales/siguientes para evitar bloquear la operación.
      if (hasNext && (res.status === 404 || (fromConfiguredBase && [502, 503, 504].includes(res.status)))) {
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i === bases.length - 1) throw err;
    }
  }
  throw lastErr || new Error("No se pudo conectar con la API.");
}

async function logAudit(action, entity, entityId, detail) {
  try {
    await fetchApi("/api/audit", {
      method: "POST",
      body: JSON.stringify({ action, entity, entityId: String(entityId || ""), detail }),
    });
  } catch { /* no bloquea la operación */ }
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
    .map((p) => ({ ...p, iva: ivaPct(p?.iva), unidadMedida: normalizeUnidadMedida(p?.unidadMedida) }));
  const operaciones = (Array.isArray(src.operaciones) ? src.operaciones : SEED.operaciones)
    .map((op) => {
      const base = op.opBaseId || opBaseId(op.id);
      return {
        ...op,
        opBaseId: base,
        opLine: num(op.opLine) > 0 ? num(op.opLine) : parseLineNo(op.id),
        ...ensureAnulacionFields(op),
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
        numeroFactura: String(f?.numeroFactura || f?.numeroComprobante || "").trim(),
        ivaPct: facturaIvaPct(f, productos),
        clienteId: hasValue(f.clienteId) ? +f.clienteId : (op?.clienteId || null),
        vendedorId: hasValue(f.vendedorId) ? +f.vendedorId : (op?.vendedorId || null),
        ...ensureAnulacionFields(f),
      };
    });
  const remitos = (Array.isArray(src.remitos) ? src.remitos : SEED.remitos)
    .map((r) => ({ ...r, ...ensureAnulacionFields(r) }));
  const recibos = (Array.isArray(src.recibos) ? src.recibos : SEED.recibos)
    .map((r) => {
      const apps = normalizeReciboAplicaciones(r?.facturasAplicadas);
      return {
        ...r,
        medioPago: String(r?.medioPago || "").toUpperCase() === "CHEQUE" ? "CHEQUE_TERCERO" : r?.medioPago,
        clienteId: hasValue(r.clienteId) ? +r.clienteId : null,
        tc: num(r?.tc) || 1,
        facturaId: String(r?.facturaId || apps[0]?.facturaId || ""),
        facturasAplicadas: apps,
        ...ensureAnulacionFields(r),
      };
    });
  const comprasBase = (Array.isArray(src.compras) ? src.compras : SEED.compras)
    .map((c) => {
      const cantidad = Math.max(0, num(c?.cantidad));
      const precio = num(c?.precio);
      const ivaCompra = hasValue(c?.ivaPct) ? ivaPct(c.ivaPct) : productoIvaPct(productos, c?.productoId);
      const subtotalCalc = cantidad * precio;
      const ivaMontoCalc = ivaAmount(subtotalCalc, ivaCompra);
      const totalConIvaCalc = subtotalCalc + ivaMontoCalc;
      const cantRecibida = Math.max(0, Math.min(cantidad, num(c?.cantRecibida)));
      const cantFacturada = Math.max(0, Math.min(cantidad, hasValue(c?.cantFacturada) ? num(c.cantFacturada) : 0));
      const base = c?.ocBaseId || compraBaseIdFromId(c?.id || "");
      return {
        ...c,
        id: String(c?.id || ""),
        fecha: String(c?.fecha || "").slice(0, 10),
        proveedorId: hasValue(c?.proveedorId) ? +c.proveedorId : null,
        productoId: hasValue(c?.productoId) ? +c.productoId : null,
        cantidad,
        precio,
        ivaPct: ivaCompra,
        subtotal: hasValue(c?.subtotal) ? num(c.subtotal) : subtotalCalc,
        ivaMonto: hasValue(c?.ivaMonto) ? num(c.ivaMonto) : ivaMontoCalc,
        totalConIva: hasValue(c?.totalConIva) ? num(c.totalConIva) : totalConIvaCalc,
        moneda: String(c?.moneda || "USD").toUpperCase() === "DOLAR" ? "USD" : (String(c?.moneda || "USD").toUpperCase() || "USD"),
        tc: num(c?.tc) || 1,
        cantRecibida,
        cantFacturada,
        ocBaseId: base,
        ocLine: num(c?.ocLine) > 0 ? num(c.ocLine) : parseLineNo(c?.id || ""),
        ocLines: num(c?.ocLines) > 0 ? num(c.ocLines) : 1,
        medioPago: String(c?.medioPago || "").toUpperCase() === "CHEQUE" ? "CHEQUE_PROPIO" : String(c?.medioPago || "").toUpperCase(),
        fechaFacturaProv: c?.fechaFacturaProv || "",
        pagadoUSD: hasValue(c?.pagadoUSD) ? num(c.pagadoUSD) : moneyToUSD(c?.pagado, c?.moneda, c?.tc),
        ...ensureAnulacionFields(c),
      };
    });
  const comprasById = new Map(comprasBase.map((c) => [String(c.id), c]));

  const hasRemitosCompraSrc = Array.isArray(src.remitosCompra);
  const remitosCompraSeed = hasRemitosCompraSrc
    ? src.remitosCompra
    : comprasBase
      .filter((c) => num(c.cantRecibida) > 0)
      .map((c, idx) => ({
        id: `RMP_${pad4(idx + 1)}`,
        compraId: c.id,
        compraBaseId: c.ocBaseId,
        fecha: c.recepcion || c.fecha,
        numeroProveedor: "",
        proveedorId: c.proveedorId,
        productoId: c.productoId,
        cantidad: c.cantRecibida,
        lote: c.lote || "",
        obs: "Migrado desde compra legacy",
      }));
  const remitosCompra = (Array.isArray(remitosCompraSeed) ? remitosCompraSeed : [])
    .map((r) => {
      const compra = comprasById.get(String(r?.compraId || ""));
      const base = r?.compraBaseId || compra?.ocBaseId || compraBaseIdFromId(r?.compraId || r?.id || "");
      return {
        ...r,
        id: String(r?.id || ""),
        compraId: r?.compraId ? String(r.compraId) : null,
        compraBaseId: base,
        fecha: String(r?.fecha || compra?.recepcion || compra?.fecha || "").slice(0, 10),
        numeroProveedor: String(r?.numeroProveedor || r?.numeroRemitoProv || "").trim(),
        proveedorId: hasValue(r?.proveedorId) ? +r.proveedorId : (compra?.proveedorId || null),
        productoId: hasValue(r?.productoId) ? +r.productoId : (compra?.productoId || null),
        cantidad: Math.max(0, num(r?.cantidad)),
        lote: r?.lote || "",
        obs: r?.obs || "",
        ...ensureAnulacionFields(r),
      };
    });

  const hasFacturasCompraSrc = Array.isArray(src.facturasCompra);
  const facturasCompraSeed = hasFacturasCompraSrc
    ? src.facturasCompra
    : comprasBase
      .filter((c) => num(c.cantFacturada) > 0)
      .map((c, idx) => ({
        id: `FCP_${pad4(idx + 1)}`,
        compraId: c.id,
        compraBaseId: c.ocBaseId,
        fecha: c.fechaFacturaProv || c.fecha,
        proveedorId: c.proveedorId,
        productoId: c.productoId,
        cantidad: c.cantFacturada,
        precioUnit: c.precio,
        ivaPct: productoIvaPct(productos, c.productoId),
        moneda: c.moneda || "USD",
        tc: num(c.tc) || 1,
        numeroProveedor: "",
      }));
  const facturasCompra = (Array.isArray(facturasCompraSeed) ? facturasCompraSeed : [])
    .map((f) => {
      const compra = comprasById.get(String(f?.compraId || ""));
      const base = f?.compraBaseId || compra?.ocBaseId || compraBaseIdFromId(f?.compraId || f?.id || "");
      const cantidad = Math.max(0, num(f?.cantidad));
      const precioUnit = num(f?.precioUnit);
      const ivaLinea = facturaCompraIvaPct(f, productos);
      const subtotalCalc = cantidad * precioUnit;
      const ivaMontoCalc = ivaAmount(subtotalCalc, ivaLinea);
      const totalConIvaCalc = subtotalCalc + ivaMontoCalc;
      return {
        ...f,
        id: String(f?.id || ""),
        compraId: f?.compraId ? String(f.compraId) : null,
        compraBaseId: base,
        fecha: String(f?.fecha || compra?.fechaFacturaProv || compra?.fecha || "").slice(0, 10),
        proveedorId: hasValue(f?.proveedorId) ? +f.proveedorId : (compra?.proveedorId || null),
        productoId: hasValue(f?.productoId) ? +f.productoId : (compra?.productoId || null),
        cantidad,
        precioUnit,
        ivaPct: ivaLinea,
        subtotal: hasValue(f?.subtotal) ? num(f.subtotal) : subtotalCalc,
        ivaMonto: hasValue(f?.ivaMonto) ? num(f.ivaMonto) : ivaMontoCalc,
        totalConIva: hasValue(f?.totalConIva) ? num(f.totalConIva) : totalConIvaCalc,
        moneda: String(f?.moneda || compra?.moneda || "USD").toUpperCase(),
        tc: num(f?.tc) || num(compra?.tc) || 1,
        numeroProveedor: String(f?.numeroProveedor || "").trim(),
        fechaVencimiento: String(f?.fechaVencimiento || "").slice(0, 10),
        ...ensureAnulacionFields(f),
      };
    });

  const hasRecibosCompraSrc = Array.isArray(src.recibosCompra);
  const recibosCompraSeed = hasRecibosCompraSrc
    ? src.recibosCompra
    : comprasBase
      .filter((c) => num(c.pagadoUSD) > 0.0001 || num(c.pagado) > 0.0001)
      .map((c, idx) => ({
        id: `RCP_${pad4(idx + 1)}`,
        fecha: c.fechaPago || c.fecha,
        compraId: c.id,
        compraBaseId: c.ocBaseId,
        proveedorId: c.proveedorId,
        monto: num(c.pagado) || num(c.pagadoUSD),
        moneda: c.monedaPago || c.moneda || "USD",
        tc: num(c.tcPago) || num(c.tc) || 1,
        medioPago: c.medioPago || "TRANSFERENCIA",
        chequeId: c.chequeId || null,
        numeroRecibo: c.id,
      }));
  const recibosCompra = (Array.isArray(recibosCompraSeed) ? recibosCompraSeed : [])
    .map((r) => {
      const compra = comprasById.get(String(r?.compraId || ""));
      const base = r?.compraBaseId || compra?.ocBaseId || compraBaseIdFromId(r?.compraId || r?.id || "");
      const apps = normalizeReciboCompraAplicaciones(r?.facturasCompraAplicadas);
      return {
        ...r,
        id: String(r?.id || ""),
        fecha: String(r?.fecha || compra?.fecha || "").slice(0, 10),
        compraId: r?.compraId ? String(r.compraId) : null,
        compraBaseId: base,
        proveedorId: hasValue(r?.proveedorId) ? +r.proveedorId : (compra?.proveedorId || null),
        facturaCompraId: String(r?.facturaCompraId || apps[0]?.facturaCompraId || ""),
        facturasCompraAplicadas: apps,
        numeroRecibo: r?.numeroRecibo || "",
        monto: Math.max(0, num(r?.monto)),
        moneda: String(r?.moneda || compra?.moneda || "USD").toUpperCase(),
        tc: num(r?.tc) || num(compra?.tc) || 1,
        medioPago: String(r?.medioPago || "").toUpperCase() === "CHEQUE" ? "CHEQUE_TERCERO" : String(r?.medioPago || "").toUpperCase(),
        impactaCuenta: r?.impactaCuenta === false ? false : (String(r?.medioPago || "").toUpperCase() !== "SALDO_A_FAVOR"),
        chequeId: r?.chequeId ? String(r.chequeId) : null,
        concepto: r?.concepto || "",
        ...ensureAnulacionFields(r),
      };
    });
  const compraRefs = buildCompraDocRefSets(comprasBase);
  const remitosCompraLinked = remitosCompra.filter((r) => isCompraDocLinkedToRefs(r, compraRefs));
  const facturasCompraLinked = facturasCompra.filter((f) => isCompraDocLinkedToRefs(f, compraRefs));
  const facturaCompraLinkedIds = new Set(facturasCompraLinked.map((f) => String(f.id)));
  const recibosCompraLinked = recibosCompra.filter((r) =>
    isCompraDocLinkedToRefs(r, compraRefs)
    || normalizeReciboCompraAplicaciones(r?.facturasCompraAplicadas)
      .some((ap) => facturaCompraLinkedIds.has(String(ap.facturaCompraId || ""))),
  );

  const recibidaByCompra = new Map();
  for (const r of remitosCompraLinked) {
    if (r.anulado || !r.compraId) continue;
    const k = String(r.compraId);
    recibidaByCompra.set(k, num(recibidaByCompra.get(k)) + num(r.cantidad));
  }
  const facturadaByCompra = new Map();
  const fechaFacturaByCompra = new Map();
  for (const f of facturasCompraLinked) {
    if (f.anulado || !f.compraId) continue;
    const k = String(f.compraId);
    facturadaByCompra.set(k, num(facturadaByCompra.get(k)) + num(f.cantidad));
    const prev = fechaFacturaByCompra.get(k);
    if (!prev || String(f.fecha || "") > String(prev || "")) fechaFacturaByCompra.set(k, f.fecha);
  }
  const pagadoUsdByCompra = new Map();
  const compraIdByFacturaCompra = new Map(
    facturasCompraLinked.map((f) => [String(f.id), String(f.compraId || "")]),
  );
  for (const r of recibosCompraLinked) {
    if (r.anulado) continue;
    const apps = normalizeReciboCompraAplicaciones(r?.facturasCompraAplicadas);
    if (apps.length) {
      for (const ap of apps) {
        const fId = String(ap.facturaCompraId || "");
        const compraId = String(ap.compraId || compraIdByFacturaCompra.get(fId) || "");
        if (!compraId) continue;
        pagadoUsdByCompra.set(compraId, num(pagadoUsdByCompra.get(compraId)) + num(ap.montoUSD));
      }
      continue;
    }
    if (!r.compraId) continue;
    const k = String(r.compraId);
    pagadoUsdByCompra.set(k, num(pagadoUsdByCompra.get(k)) + reciboCompraUSD(r));
  }

  const compras = comprasBase.map((c) => {
    const key = String(c.id);
    const hasDocs = recibidaByCompra.has(key) || facturadaByCompra.has(key) || pagadoUsdByCompra.has(key);
    if (!hasDocs) return c;
    const cantRecibida = Math.max(0, Math.min(num(c.cantidad), num(recibidaByCompra.get(key))));
    const cantFacturada = Math.max(0, Math.min(num(c.cantidad), num(facturadaByCompra.get(key))));
    const pagadoUSD = Math.max(0, num(pagadoUsdByCompra.get(key)));
    const moneda = String(c.moneda || "USD").toUpperCase();
    const pagado = (moneda === "PESOS" || moneda === "ARS")
      ? pagadoUSD * (num(c.tc) || 1)
      : pagadoUSD;
    return {
      ...c,
      cantRecibida,
      cantFacturada,
      fechaFacturaProv: fechaFacturaByCompra.get(key) || c.fechaFacturaProv || "",
      pagadoUSD,
      pagado,
    };
  });
  const proveedores = Array.isArray(src.proveedores) ? src.proveedores : SEED.proveedores;
  const vendedores = Array.isArray(src.vendedores) ? src.vendedores : SEED.vendedores;
  const costos = (Array.isArray(src.costos) ? src.costos : SEED.costos)
    .map((c) => ({ ...c, ...ensureAnulacionFields(c) }));
  const notasCredito = (Array.isArray(src.notasCredito) ? src.notasCredito : [])
    .map((n) => {
      const origen = String(n?.origen || "").toLowerCase();
      const normalizedOrigen = origen === "recibida" || hasValue(n?.proveedorId) || hasValue(n?.facturaCompraId) ? "recibida" : "emitida";
      return {
        ...n,
        origen: normalizedOrigen,
        clienteId: hasValue(n?.clienteId) ? +n.clienteId : null,
        proveedorId: hasValue(n?.proveedorId) ? +n.proveedorId : null,
        facturaId: String(n?.facturaId || ""),
        facturaCompraId: String(n?.facturaCompraId || ""),
        monto: num(n?.monto),
        ...ensureAnulacionFields(n),
      };
    });
  const notasDebito = (Array.isArray(src.notasDebito) ? src.notasDebito : [])
    .map((n) => {
      const origen = String(n?.origen || "").toLowerCase();
      const normalizedOrigen = origen === "recibida" || hasValue(n?.proveedorId) || hasValue(n?.facturaCompraId) ? "recibida" : "emitida";
      return {
        ...n,
        origen: normalizedOrigen,
        clienteId: hasValue(n?.clienteId) ? +n.clienteId : null,
        proveedorId: hasValue(n?.proveedorId) ? +n.proveedorId : null,
        facturaId: String(n?.facturaId || ""),
        facturaCompraId: String(n?.facturaCompraId || ""),
        monto: num(n?.monto),
        ...ensureAnulacionFields(n),
      };
    });
  const cotizaciones = (Array.isArray(src.cotizaciones) ? src.cotizaciones : [])
    .map((c) => ({ ...c, venta: num(c.venta), compra: num(c.compra), ...ensureAnulacionFields(c) }))
    .sort((a, b) => String(a.fecha || a.timestamp || "").localeCompare(String(b.fecha || b.timestamp || "")));
  const cheques = (Array.isArray(src.cheques) ? src.cheques : [])
    .map((c) => ({
      ...c,
      tipo: c?.tipo || chequeTipoFromMedio(c?.medioPago || "CHEQUE_TERCERO"),
      numero: c?.numero || "",
      banco: c?.banco || "",
      importe: num(c?.importe),
      moneda: c?.moneda || "PESOS",
      tc: num(c?.tc) || 1,
      fechaEmision: String(c?.fechaEmision || c?.fecha || "").slice(0, 10),
      fechaVencimiento: String(c?.fechaVencimiento || "").slice(0, 10),
      estado: CHEQUE_ESTADOS.includes(c?.estado) ? c.estado : "en_cartera",
      historialEstados: Array.isArray(c?.historialEstados) ? c.historialEstados : [],
      ...ensureAnulacionFields(c),
    }))
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")));
  const costeoStock = buildStockCosteo(productos, compras, remitos);
  const productosCosteados = costeoStock.productos;
  const movimientosStock = costeoStock.movimientosStock;
  const usuarios = (Array.isArray(src.usuarios) && src.usuarios.length ? src.usuarios : SEED.usuarios)
    .map((u) => ({
      ...u,
      id: num(u.id) || 0,
      rol: String(u.rol || "vendedor").toLowerCase() === "admin" ? "admin" : "vendedor",
      activo: u.activo !== false,
    }))
    .filter((u) => u.id > 0);
  const auditoria = Array.isArray(src.auditoria) ? src.auditoria : [];
  const sesionSrc = src.sesion && typeof src.sesion === "object" ? src.sesion : SEED.sesion;
  const fallbackUser = usuarios.find((u) => u.activo !== false) || usuarios[0] || { id: 1 };
  const sesion = {
    usuarioId: hasValue(sesionSrc?.usuarioId) ? +sesionSrc.usuarioId : +fallbackUser.id,
  };
  if (!usuarios.some((u) => +u.id === +sesion.usuarioId && u.activo !== false)) {
    sesion.usuarioId = +fallbackUser.id;
  }

  const computedCnt = {
    op: maxIdByRegex(operaciones, /^OP_(\d+)/),
    fac: maxIdByRegex(facturas, /^F_(\d+)/),
    rem: maxIdByRegex(remitos, /^R-(\d+)/),
    rec: maxIdByRegex(recibos, /^RC_(\d+)/),
    oc: maxIdByRegex(compras, /^OC_(\d+)/),
    rmp: maxIdByRegex(remitosCompraLinked, /^RMP_(\d+)/),
    fcp: maxIdByRegex(facturasCompraLinked, /^FCP_(\d+)/),
    rcp: maxIdByRegex(recibosCompraLinked, /^RCP_(\d+)/),
    cos: maxIdByRegex(costos, /^C-(\d+)/),
    nc: maxIdByRegex(notasCredito, /^NC_(\d+)/),
    nd: maxIdByRegex(notasDebito, /^ND_(\d+)/),
    cot: maxIdByRegex(cotizaciones, /^COT_(\d+)/),
    chk: maxIdByRegex(cheques, /^CHK_(\d+)/),
    cli: (clientes || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
    prov: (proveedores || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
    prod: (productosCosteados || []).reduce((m, x) => Math.max(m, num(x?.id)), 0),
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
    productos: productosCosteados,
    clientes,
    proveedores,
    operaciones,
    facturas,
    remitos,
    recibos,
    compras,
    remitosCompra: remitosCompraLinked,
    facturasCompra: facturasCompraLinked,
    recibosCompra: recibosCompraLinked,
    costos,
    movimientosStock,
    cheques,
    notasCredito,
    notasDebito,
    cotizaciones,
    usuarios,
    sesion,
    auditoria,
    cnt,
  };
}

// ─── PANTALLA DE LOGIN ───────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [setupForm, setSetupForm] = useState({ nombre: "", username: "", password: "", confirm: "" });
  const [setupErr, setSetupErr] = useState("");
  const passRef = useRef(null);

  useEffect(() => {
    fetchApi("/auth/setup").then(r => r.json()).then(j => { if (j.setupRequired) setSetupMode(true); }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const json = await r.json();
      if (!r.ok) { setError(json?.error || "Error al iniciar sesión."); setLoading(false); return; }
      setToken(json.token);
      onLogin(json.user);
    } catch {
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setSetupErr("");
    const { nombre, username: u, password: p, confirm } = setupForm;
    if (!nombre.trim() || !u.trim() || !p) return setSetupErr("Completá todos los campos.");
    if (p.length < 6) return setSetupErr("La contraseña debe tener al menos 6 caracteres.");
    if (p !== confirm) return setSetupErr("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const r = await fetchApi("/auth/setup", { method: "POST", body: JSON.stringify({ nombre: nombre.trim(), username: u.trim().toLowerCase(), password: p }) });
      const json = await r.json();
      if (!r.ok) return setSetupErr(json?.error || "Error al crear el administrador.");
      setSetupMode(false);
    } catch { setSetupErr("No se pudo conectar con el servidor."); }
    finally { setLoading(false); }
  };

  const ssf = (k, v) => setSetupForm(f => ({ ...f, [k]: v }));

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#14532D] to-[#1D4B35]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center mb-4 border border-white/20">
            <span className="text-white font-black text-xl tracking-wide">LDS</span>
          </div>
          <h1 className="text-white text-2xl font-bold">LDS AGRO ERP</h1>
          <p className="text-emerald-300 text-sm mt-1">{setupMode ? "Configuración inicial" : "Iniciá sesión para continuar"}</p>
        </div>

        {setupMode ? (
          <form onSubmit={handleSetup} className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 font-medium">Primera vez en este equipo — creá el usuario administrador.</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
              <input autoFocus type="text" value={setupForm.nombre} onChange={e => ssf("nombre", e.target.value)} placeholder="Ej: Anibal López" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario (para login)</label>
              <input type="text" value={setupForm.username} onChange={e => ssf("username", e.target.value)} placeholder="Ej: admin" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input type="password" value={setupForm.password} onChange={e => ssf("password", e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar contraseña</label>
              <input type="password" value={setupForm.confirm} onChange={e => ssf("confirm", e.target.value)} placeholder="Repetí la contraseña" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={loading} />
            </div>
            {setupErr && <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{setupErr}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#1F7A4D] hover:bg-[#14532D] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
              {loading ? "Creando..." : "Crear administrador"}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario</label>
            <input
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && passRef.current?.focus()}
              placeholder="tu usuario"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
            <input
              ref={passRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full bg-[#1F7A4D] hover:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        )}
        <p className="text-emerald-400 text-xs text-center mt-6 opacity-60">v2.1 — Sistema ERP Agro</p>
      </div>
    </div>
  );
}

// ─── USUARIOS (ADMIN) ────────────────────────────────────────────────────────
function UsuariosAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchApi("/auth/users");
      if (r.ok) { const j = await r.json(); setUsers(j.users || []); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: "", username: "", password: "", role: "VENDEDOR" });
    setErr("");
    setModal(true);
  };

  const openEdit = (u) => {
    setEditId(u.id);
    setForm({ nombre: u.nombre, username: u.username, password: "", role: u.role, active: u.active });
    setErr("");
    setModal(true);
  };

  const save = async () => {
    setErr("");
    if (!form.nombre?.trim() || !form.username?.trim()) return setErr("Completá nombre y usuario.");
    if (!editId && !form.password?.trim()) return setErr("La contraseña es obligatoria para usuarios nuevos.");
    if (form.password && form.password.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    setSaving(true);
    try {
      let r;
      if (editId) {
        const body = { nombre: form.nombre.trim(), role: form.role, active: form.active };
        if (form.password?.trim()) body.password = form.password;
        r = await fetchApi(`/auth/users/${editId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        r = await fetchApi("/auth/users", { method: "POST", body: JSON.stringify({ nombre: form.nombre.trim(), username: form.username.trim().toLowerCase(), password: form.password, role: form.role }) });
      }
      const j = await r.json();
      if (!r.ok) return setErr(j?.error || "Error al guardar.");
      setModal(false);
      load();
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    const r = await fetchApi(`/auth/users/${u.id}`, { method: "PUT", body: JSON.stringify({ active: !u.active }) });
    if (r.ok) load();
  };

  const sf = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const roleBadge = (role) => role === "ADMIN"
    ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1F7A4D]/15 text-[#1F7A4D]">ADMIN</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">VENDEDOR</span>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#17211B]">Usuarios del sistema</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Gestioná quién tiene acceso y con qué permisos.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#1F7A4D] hover:bg-[#14532D] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <UserPlus size={15} /> Nuevo usuario
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-[#6B7280] text-sm">Cargando usuarios…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAF8]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Creado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAF8] transition-colors">
                  <td className="px-5 py-3 font-medium text-[#17211B]">{u.nombre}</td>
                  <td className="px-5 py-3 text-[#6B7280] font-mono text-xs">{u.username}</td>
                  <td className="px-5 py-3">{roleBadge(u.role)}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(u)} className="flex items-center gap-1.5 text-xs font-medium">
                      {u.active
                        ? <><ToggleRight size={18} className="text-[#1F7A4D]" /><span className="text-[#1F7A4D]">Activo</span></>
                        : <><ToggleLeft size={18} className="text-[#9CA3AF]" /><span className="text-[#9CA3AF]">Inactivo</span></>}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-[#9CA3AF] text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-AR") : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(u)} className="text-[#1F7A4D] hover:text-[#14532D] font-medium text-xs flex items-center gap-1 ml-auto">
                      <KeyRound size={13} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} className="text-[#1F7A4D]" />
              <h3 className="font-bold text-[#17211B] text-lg">{editId ? "Editar usuario" : "Nuevo usuario"}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6B7280] mb-1 block">Nombre completo</label>
                <input value={form.nombre || ""} onChange={(e) => sf("nombre", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ej: Juan García" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B7280] mb-1 block">Usuario (para login)</label>
                <input value={form.username || ""} onChange={(e) => sf("username", e.target.value)} disabled={!!editId} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400" placeholder="Ej: jgarcia" />
                {editId && <p className="text-xs text-[#9CA3AF] mt-1">El nombre de usuario no se puede cambiar.</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B7280] mb-1 block">{editId ? "Nueva contraseña (dejá vacío para no cambiar)" : "Contraseña"}</label>
                <input type="password" value={form.password || ""} onChange={(e) => sf("password", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={editId ? "••••••••" : "Mínimo 6 caracteres"} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B7280] mb-1 block">Rol</label>
                <select value={form.role || "VENDEDOR"} onChange={(e) => sf("role", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="VENDEDOR">VENDEDOR — acceso limitado</option>
                  <option value="ADMIN">ADMIN — acceso completo</option>
                </select>
              </div>
              {editId && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active !== false} onChange={(e) => sf("active", e.target.checked)} className="accent-emerald-600" />
                  <span className="text-sm text-[#374151]">Usuario activo</span>
                </label>
              )}
            </div>
            {err && <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-[#1F7A4D] hover:bg-[#14532D] disabled:opacity-50 text-white rounded-xl py-2 text-sm font-semibold transition-colors">
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTAS DE CRÉDITO / DÉBITO ──────────────────────────────────────────────

function NotasCreditoDebito({ data, onUpdate, tipo, currentUser }) {
  // tipo: "credito" | "debito"
  const key = tipo === "credito" ? "notasCredito" : "notasDebito";
  const prefix = tipo === "credito" ? "NC_" : "ND_";
  const cntKey = tipo === "credito" ? "nc" : "nd";
  const label = tipo === "credito" ? "Nota de Crédito" : "Nota de Débito";
  const notas = data[key] || [];
  const { clientes, facturas, proveedores = [], facturasCompra = [] } = data;
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [anularRec, setAnularRec] = useState(null);
  const [showAnulados, setShowAnulados] = useState(false);
  const [origenFilter, setOrigenFilter] = useState("emitidas");
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEmitidas = origenFilter === "emitidas";
  const notaOrigen = (n) => {
    const raw = String(n?.origen || "").toLowerCase();
    if (raw === "emitida" || raw === "recibida") return raw;
    return hasValue(n?.proveedorId) || hasValue(n?.facturaCompraId) ? "recibida" : "emitida";
  };

  const openNew = () => {
    setEditId(null);
    setForm({
      fecha: today(),
      clienteId: "",
      proveedorId: "",
      facturaId: "",
      facturaCompraId: "",
      concepto: "",
      monto: "",
      origen: isEmitidas ? "emitida" : "recibida",
    });
    setModal(true);
  };
  const openEdit = (n) => {
    const origen = notaOrigen(n);
    setOrigenFilter(origen === "recibida" ? "recibidas" : "emitidas");
    setEditId(n.id);
    setForm({
      ...n,
      origen,
      clienteId: hasValue(n?.clienteId) ? String(n.clienteId) : "",
      proveedorId: hasValue(n?.proveedorId) ? String(n.proveedorId) : "",
      facturaId: String(n?.facturaId || ""),
      facturaCompraId: String(n?.facturaCompraId || ""),
    });
    setModal(true);
  };
  const handleAnular = (motivo) => {
    onUpdate(key, aplicarAnulacion(notas, anularRec.id, motivo, currentUser));
    setAnularRec(null);
  };
  const notasFiltradas = notas
    .filter((n) => (showAnulados || !n.anulado))
    .filter((n) => (notaOrigen(n) === "recibida" ? "recibidas" : "emitidas") === origenFilter);

  const save = () => {
    const origen = isEmitidas ? "emitida" : "recibida";
    if (!form.fecha || !form.monto) return alert("Completa Fecha y Monto.");
    if (origen === "emitida" && !form.clienteId) return alert("Selecciona un cliente.");
    if (origen === "recibida" && !form.proveedorId) return alert("Selecciona un proveedor.");
    const monto = num(form.monto);
    if (monto <= 0) return alert("El monto debe ser mayor a 0.");
    const clienteId = origen === "emitida" && hasValue(form.clienteId) ? +form.clienteId : null;
    const proveedorId = origen === "recibida" && hasValue(form.proveedorId) ? +form.proveedorId : null;
    const facturaId = origen === "emitida" ? String(form.facturaId || "") : "";
    const facturaCompraId = origen === "recibida" ? String(form.facturaCompraId || "") : "";
    if (facturaId) {
      const fac = facturas.find((f) => String(f.id) === facturaId && !f.anulado);
      if (!fac) return alert("La factura seleccionada no existe o esta anulada.");
      if (clienteId && +fac.clienteId !== +clienteId) return alert("La factura no pertenece al cliente seleccionado.");
    }
    if (facturaCompraId) {
      const fac = facturasCompra.find((f) => String(f.id) === facturaCompraId && !f.anulado);
      if (!fac) return alert("La factura de compra seleccionada no existe o esta anulada.");
      if (proveedorId && +fac.proveedorId !== +proveedorId) return alert("La factura no pertenece al proveedor seleccionado.");
    }
    const nota = {
      ...form,
      origen,
      clienteId,
      proveedorId,
      facturaId,
      facturaCompraId,
      monto,
    };
    if (editId) {
      nota.id = editId;
      onUpdate(key, notas.map(n => n.id === editId ? nota : n));
    } else {
      const n = (data.cnt[cntKey] || 0) + 1;
      nota.id = `${prefix}${pad4(n)}`;
      onUpdate(key, [...notas, nota]);
      onUpdate("cnt", { ...data.cnt, [cntKey]: n });
    }
    setModal(false);
  };

  return (
    <div>
      <PageHdr
        title={label + "s"}
        sub={isEmitidas
          ? (tipo === "credito" ? "Descuentos y devoluciones a clientes" : "Ajustes de deuda a clientes")
          : (tipo === "credito" ? "Notas recibidas de proveedores (saldo a favor)" : "Ajustes recibidos de proveedores")}
        onNew={openNew}
        btn={isEmitidas ? `+ Nueva ${label}` : `+ Registrar ${label} Recibida`}
      />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Origen:</span>
          <button
            type="button"
            onClick={() => setOrigenFilter("emitidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isEmitidas
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Emitidas
          </button>
          <button
            type="button"
            onClick={() => setOrigenFilter("recibidas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              !isEmitidas
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"
            }`}
          >
            Recibidas
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anulados
        </label>
      </div>
      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID", "Fecha", isEmitidas ? "Cliente" : "Proveedor", "Factura ref.", "Concepto", "Monto USD", ""]} />
          <tbody>
            {notasFiltradas.map(n => {
              const an = n.anulado;
              const esRecibida = notaOrigen(n) === "recibida";
              const entidadNombre = esRecibida
                ? lookupNombre(proveedores, n.proveedorId)
                : lookupNombre(clientes, n.clienteId);
              const facturaRef = esRecibida ? (n.facturaCompraId || "-") : (n.facturaId || "-");
              return (
                <TR key={n.id} className={an ? "opacity-50 line-through" : ""}>
                  <TD mono><span className={tipo === "credito" ? "text-blue-600 font-bold" : "text-orange-600 font-bold"}>{n.id}</span></TD>
                  <TD>{fmtD(n.fecha)}</TD>
                  <TD bold>{entidadNombre}</TD>
                  <TD mono gray>{facturaRef}</TD>
                  <TD gray>{n.concepto || "-"}</TD>
                  <TD right green>USD {fmt(n.monto)}</TD>
                  <Btns anulado={an} onEdit={() => openEdit(n)} onAnular={() => setAnularRec(n)} />
                </TR>
              );
            })}
            {!notasFiltradas.length && <EmptyRow cols={7} />}
          </tbody>
        </table>
      </Card>

      {modal && (
        <Modal title={editId ? `Editar ${label}` : `Nueva ${label}`} onClose={() => setModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *"><input type="date" className={IC} value={form.fecha || ""} onChange={e => sf("fecha", e.target.value)} /></Fl>
            {isEmitidas ? (
              <>
                <Fl label="Cliente *">
                  <select className={IC} value={form.clienteId || ""} onChange={e => { sf("clienteId", e.target.value); sf("facturaId", ""); }}>
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </Fl>
                <Fl label="Factura referencia (opcional)">
                  <select className={IC} value={form.facturaId || ""} onChange={e => sf("facturaId", e.target.value)}>
                    <option value="">Sin referencia</option>
                    {facturas
                      .filter(f => !f.anulado)
                      .filter(f => !form.clienteId || +f.clienteId === +form.clienteId)
                      .map(f => <option key={f.id} value={f.id}>{f.id}</option>)}
                  </select>
                </Fl>
              </>
            ) : (
              <>
                <Fl label="Proveedor *">
                  <select className={IC} value={form.proveedorId || ""} onChange={e => { sf("proveedorId", e.target.value); sf("facturaCompraId", ""); }}>
                    <option value="">Seleccionar...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </Fl>
                <Fl label="Factura compra ref. (opcional)">
                  <select className={IC} value={form.facturaCompraId || ""} onChange={e => sf("facturaCompraId", e.target.value)}>
                    <option value="">Sin referencia</option>
                    {facturasCompra
                      .filter(f => !f.anulado)
                      .filter(f => !form.proveedorId || +f.proveedorId === +form.proveedorId)
                      .map(f => <option key={f.id} value={f.id}>{f.id}</option>)}
                  </select>
                </Fl>
              </>
            )}
            <Fl label="Monto USD *"><input type="number" className={IC} min="0" step="0.01" value={form.monto || ""} onChange={e => sf("monto", e.target.value)} /></Fl>
            <Fl label="Concepto" span2><input type="text" className={IC} value={form.concepto || ""} onChange={e => sf("concepto", e.target.value)} /></Fl>
          </div>
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
      {anularRec && (
        <AnularModal
          entityLabel={label}
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}

function NotasCredito(props) { return <NotasCreditoDebito {...props} tipo="credito" />; }
function NotasDebito(props) { return <NotasCreditoDebito {...props} tipo="debito" />; }

// ─── ESTADO DE CUENTA ────────────────────────────────────────────────────────

function EstadoCuenta({ data }) {
  const {
    clientes,
    proveedores,
    facturas,
    recibos,
    notasCredito,
    notasDebito,
    productos,
    compras,
    facturasCompra = [],
    recibosCompra = [],
  } = data;
  const [tipoCuenta, setTipoCuenta] = useState("cliente");
  const [entidadId, setEntidadId] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const esCliente = tipoCuenta === "cliente";
  const entidades = esCliente ? clientes : proveedores;
  const entidad = entidades.find((e) => +e.id === +entidadId) || null;

  useEffect(() => {
    setEntidadId("");
  }, [tipoCuenta]);

  const agruparFacturasMadreCliente = (rows = []) => {
    const map = new Map();
    for (const f of rows) {
      const key = String(facturaBaseId(f) || f?.id || "").trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }
    return Array.from(map.entries()).map(([baseId, lines]) => {
      lines.sort((a, b) => facturaLineNo(a) - facturaLineNo(b));
      const head = lines[0] || {};
      const fecha = lines.map((x) => String(x?.fecha || "")).filter(Boolean).sort()[0] || String(head?.fecha || "");
      const total = lines.reduce((s, x) => s + facTotal(x, productos), 0);
      const numeros = Array.from(new Set(lines.map((x) => String(x?.numeroFactura || "").trim()).filter(Boolean)));
      const numeroReal = numeros.length === 1 ? numeros[0] : (numeros[0] || "");
      return {
        baseId,
        fecha,
        total,
        comprobante: numeroReal || baseId,
      };
    });
  };

  const agruparFacturasMadreProveedor = (rows = []) => {
    const map = new Map();
    for (const f of rows) {
      const key = String(f?.facBaseId || opBaseId(f?.id || "") || f?.id || "").trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }
    return Array.from(map.entries()).map(([baseId, lines]) => {
      lines.sort((a, b) => facturaLineNo(a) - facturaLineNo(b));
      const head = lines[0] || {};
      const fecha = lines.map((x) => String(x?.fecha || "")).filter(Boolean).sort()[0] || String(head?.fecha || "");
      const totalUsd = lines.reduce((s, x) => s + facCompraTotalUSD(x, productos), 0);
      const numerosProv = Array.from(new Set(lines.map((x) => String(x?.numeroProveedor || "").trim()).filter(Boolean)));
      const numeroReal = numerosProv.length === 1 ? numerosProv[0] : (numerosProv[0] || "");
      return {
        baseId,
        fecha,
        totalUsd,
        comprobante: numeroReal || baseId,
      };
    });
  };

  const movimientos = (() => {
    if (!entidadId) return [];
    const id = +entidadId;
    const movs = [];

    if (esCliente) {
      const facturasClienteAgrupadas = agruparFacturasMadreCliente(
        (facturas || []).filter((f) => +f.clienteId === id && !f.anulado),
      );
      facturasClienteAgrupadas
        .filter((f) => inDateRange(f.fecha, dateRange))
        .forEach((f) => {
          movs.push({
            fecha: f.fecha,
            id: `FAC-${f.baseId}`,
            comprobante: f.comprobante,
            tipo: "Factura",
            debito: f.total,
            credito: 0,
          });
        });

      (notasDebito || [])
        .filter((n) => +n.clienteId === id && !n.anulado && inDateRange(n.fecha, dateRange))
        .forEach((n) => movs.push({ fecha: n.fecha, id: n.id, comprobante: n.id, tipo: "Nota de Debito", debito: n.monto, credito: 0 }));

      (recibos || [])
        .filter((r) => +r.clienteId === id && !r.anulado && inDateRange(r.fecha, dateRange))
        .forEach((r) => movs.push({ fecha: r.fecha, id: r.id, comprobante: r.id, tipo: "Recibo", debito: 0, credito: reciboUSD(r) }));

      (notasCredito || [])
        .filter((n) => +n.clienteId === id && !n.anulado && inDateRange(n.fecha, dateRange))
        .forEach((n) => movs.push({ fecha: n.fecha, id: n.id, comprobante: n.id, tipo: "Nota de Credito", debito: 0, credito: n.monto }));
    } else {
      const comprasProveedorActivas = (compras || []).filter((c) => +c.proveedorId === id && !c.anulado);
      const refSetsProveedor = buildCompraDocRefSets(comprasProveedorActivas);
      const facturasProveedor = (facturasCompra || [])
        .filter((f) => +f.proveedorId === id && !f.anulado && isCompraDocLinkedToRefs(f, refSetsProveedor));
      const recibosProveedor = (recibosCompra || [])
        .filter((r) => +r.proveedorId === id && !r.anulado && isCompraDocLinkedToRefs(r, refSetsProveedor))
        .filter((r) => reciboCompraImpactaCuenta(r));
      const usaComprobantesCompra = facturasProveedor.length > 0 || recibosProveedor.length > 0;
      if (usaComprobantesCompra) {
        agruparFacturasMadreProveedor(facturasProveedor)
          .filter((f) => inDateRange(f.fecha, dateRange))
          .forEach((f) => {
            if (f.totalUsd <= 0.0001) return;
            movs.push({
              fecha: f.fecha,
              id: `${f.baseId}-COMPRA`,
              comprobante: f.comprobante,
              tipo: "Factura de Compra",
              debito: f.totalUsd,
              credito: 0,
            });
          });

        recibosProveedor
          .filter((r) => inDateRange(r.fecha, dateRange))
          .forEach((r) => {
            const pagadoUsd = reciboCompraUSD(r);
            if (pagadoUsd <= 0.0001) return;
            movs.push({
              fecha: r.fecha,
              id: `${r.id}-PAGO`,
              comprobante: r.id,
              tipo: `Pago (${medioPagoLabel(r.medioPago)})`,
              debito: 0,
              credito: pagadoUsd,
            });
          });
      } else {
        (compras || [])
          .filter((c) => +c.proveedorId === id && !c.anulado && inDateRange(c.fecha, dateRange))
          .forEach((c) => {
            const totalUsd = compraTotalUSD(c);
            const pagadoUsd = compraPagadoUSD(c);
            if (totalUsd > 0.0001) {
              movs.push({
                fecha: c.fecha,
                id: `${c.id}-COMPRA`,
                comprobante: c.id,
                tipo: "Factura de Compra",
                debito: totalUsd,
                credito: 0,
              });
            }
            if (pagadoUsd > 0.0001) {
              movs.push({
                fecha: c.fechaPago || c.fecha,
                id: `${c.id}-PAGO`,
                comprobante: c.id,
                tipo: `Pago (${medioPagoLabel(c.medioPago)})`,
                debito: 0,
                credito: pagadoUsd,
              });
            }
          });
      }
      (notasDebito || [])
        .filter((n) => +n.proveedorId === id)
        .filter((n) => !n.anulado)
        .filter((n) => String(n?.origen || "").toLowerCase() === "recibida" || hasValue(n?.proveedorId))
        .filter((n) => inDateRange(n.fecha, dateRange))
        .forEach((n) => movs.push({ fecha: n.fecha, id: n.id, comprobante: n.id, tipo: "Nota de Debito", debito: num(n.monto), credito: 0 }));
      (notasCredito || [])
        .filter((n) => +n.proveedorId === id)
        .filter((n) => !n.anulado)
        .filter((n) => String(n?.origen || "").toLowerCase() === "recibida" || hasValue(n?.proveedorId))
        .filter((n) => inDateRange(n.fecha, dateRange))
        .forEach((n) => movs.push({ fecha: n.fecha, id: n.id, comprobante: n.id, tipo: "Nota de Credito", debito: 0, credito: num(n.monto) }));
    }

    movs.sort((a, b) => {
      if (a.fecha < b.fecha) return -1;
      if (a.fecha > b.fecha) return 1;
      return String(a.id).localeCompare(String(b.id));
    });

    let saldo = 0;
    return movs.map((m) => {
      saldo += m.debito - m.credito;
      return { ...m, saldo };
    });
  })();

  const totalDebitos = movimientos.reduce((s, m) => s + m.debito, 0);
  const totalCreditos = movimientos.reduce((s, m) => s + m.credito, 0);
  const saldoFinal = movimientos.length ? movimientos[movimientos.length - 1].saldo : 0;

  const saldoAnterior = (() => {
    if (!entidadId || !dateRange.from) return 0;
    const id = +entidadId;
    const before = dateRange.from;
    let s = 0;
    if (esCliente) {
      agruparFacturasMadreCliente((facturas || []).filter((f) => +f.clienteId === id && !f.anulado))
        .filter((f) => f.fecha < before)
        .forEach((f) => { s += f.total; });
      (notasDebito || []).filter((n) => +n.clienteId === id && !n.anulado && n.fecha < before)
        .forEach((n) => { s += n.monto; });
      (recibos || []).filter((r) => +r.clienteId === id && !r.anulado && r.fecha < before)
        .forEach((r) => { s -= reciboUSD(r); });
      (notasCredito || []).filter((n) => +n.clienteId === id && !n.anulado && n.fecha < before)
        .forEach((n) => { s -= n.monto; });
    } else {
      const comprasProveedorActivas = (compras || []).filter((c) => +c.proveedorId === id && !c.anulado);
      const refSetsProveedor = buildCompraDocRefSets(comprasProveedorActivas);
      const facturasProveedor = (facturasCompra || [])
        .filter((f) => +f.proveedorId === id && !f.anulado && isCompraDocLinkedToRefs(f, refSetsProveedor));
      const recibosProveedor = (recibosCompra || [])
        .filter((r) => +r.proveedorId === id && !r.anulado && isCompraDocLinkedToRefs(r, refSetsProveedor))
        .filter((r) => reciboCompraImpactaCuenta(r));
      const usaComprobantesCompra = facturasProveedor.length > 0 || recibosProveedor.length > 0;
      if (usaComprobantesCompra) {
        agruparFacturasMadreProveedor(facturasProveedor)
          .filter((f) => f.fecha < before)
          .forEach((f) => { s += f.totalUsd; });
        recibosProveedor
          .filter((r) => r.fecha < before)
          .forEach((r) => { s -= reciboCompraUSD(r); });
      } else {
        (compras || []).filter((c) => +c.proveedorId === id && !c.anulado && c.fecha < before)
          .forEach((c) => {
            s += compraTotalUSD(c);
            s -= compraPagadoUSD(c);
          });
      }
      (notasDebito || [])
        .filter((n) => +n.proveedorId === id)
        .filter((n) => !n.anulado)
        .filter((n) => String(n?.origen || "").toLowerCase() === "recibida" || hasValue(n?.proveedorId))
        .filter((n) => n.fecha < before)
        .forEach((n) => { s += num(n.monto); });
      (notasCredito || [])
        .filter((n) => +n.proveedorId === id)
        .filter((n) => !n.anulado)
        .filter((n) => String(n?.origen || "").toLowerCase() === "recibida" || hasValue(n?.proveedorId))
        .filter((n) => n.fecha < before)
        .forEach((n) => { s -= num(n.monto); });
    }
    return s;
  })();

  const tipoColor = (tipo) => {
    if (tipo === "Factura" || tipo === "Factura de Compra") return "bg-amber-100 text-amber-700";
    if (tipo === "Nota de Debito") return "bg-orange-100 text-orange-700";
    if (tipo.startsWith("Pago") || tipo === "Recibo") return "bg-emerald-100 text-emerald-700";
    if (tipo === "Nota de Credito") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  const handlePdf = () => {
    if (!esCliente || !entidad) return;
    descargarEstadoCuentaPDF(entidad, movimientos, saldoAnterior, totalDebitos, totalCreditos, saldoFinal, dateRange);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">Estado de Cuenta</h1>
          <p className="text-sm text-gray-500">
            {esCliente ? "Saldo y movimientos por cliente" : "Saldo y movimientos por proveedor"}
          </p>
        </div>
        {esCliente && entidad && movimientos.length > 0 && (
          <button
            onClick={handlePdf}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <FileDown size={16} /> Descargar PDF
          </button>
        )}
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTipoCuenta("cliente")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${esCliente ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-300"}`}
          >
            Clientes
          </button>
          <button
            type="button"
            onClick={() => setTipoCuenta("proveedor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${!esCliente ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-300"}`}
          >
            Proveedores
          </button>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <Fl label={esCliente ? "Cliente" : "Proveedor"}>
            <select className={IC} value={entidadId} onChange={(e) => setEntidadId(e.target.value)}>
              <option value="">{esCliente ? "Seleccionar cliente..." : "Seleccionar proveedor..."}</option>
              {entidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </Fl>
          <Fl label="Desde">
            <input type="date" className={IC} value={dateRange.from} onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))} />
          </Fl>
          <Fl label="Hasta">
            <input type="date" className={IC} value={dateRange.to} onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))} />
          </Fl>
          {(dateRange.from || dateRange.to) && (
            <button className="text-xs text-gray-400 hover:text-red-500 pb-1" onClick={() => setDateRange({ from: "", to: "" })}>Limpiar fechas</button>
          )}
        </div>
      </Card>

      {entidad && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Cuenta</p>
            <p className="font-bold text-emerald-900">{entidad.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">CUIT</p>
            <p className="font-mono text-gray-800">{entidad.cuit || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Condicion IVA</p>
            <p className="text-gray-800">{entidad.condicionIva || "Responsable Inscripto"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Tipo de Cuenta</p>
            <p className="text-gray-800">Cuenta Corriente</p>
          </div>
        </div>
      )}

      {!entidadId && (
        <div className="text-center py-16 text-gray-400">
          <ListOrdered size={48} className="mx-auto mb-3 opacity-30" />
          <p>{esCliente ? "Selecciona un cliente para ver su estado de cuenta" : "Selecciona un proveedor para ver su estado de cuenta"}</p>
        </div>
      )}

      {entidadId && (
        <>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="px-4 py-2.5 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Comprobante</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Debitos (USD)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Creditos (USD)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Saldo (USD)</th>
                </tr>
              </thead>
              <tbody>
                {saldoAnterior !== 0 && (
                  <tr className="bg-gray-100 italic">
                    <td colSpan={5} className="px-4 py-2 text-gray-500 text-sm">Saldo Anterior .....</td>
                    <td className={`px-4 py-2 text-right font-mono font-bold text-sm ${saldoAnterior > 0 ? "text-red-700" : "text-emerald-700"}`}>
                      USD {fmt(saldoAnterior)}
                    </td>
                  </tr>
                )}
                {movimientos.map((m, i) => {
                  const saldoReal = saldoAnterior + m.saldo;
                  return (
                    <tr key={`${m.id}-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2.5 text-gray-700">{fmtD(m.fecha)}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-800 font-semibold">{m.comprobante || m.id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tipoColor(m.tipo)}`}>{m.tipo}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-600">
                        {m.debito > 0 ? `USD ${fmt(m.debito)}` : ""}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-600">
                        {m.credito > 0 ? `USD ${fmt(m.credito)}` : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono font-bold ${saldoReal > 0 ? "text-red-700" : saldoReal < 0 ? "text-emerald-700" : "text-gray-500"}`}>
                        USD {fmt(saldoReal)}
                      </td>
                    </tr>
                  );
                })}
                {!movimientos.length && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Sin movimientos para este periodo</td></tr>
                )}
              </tbody>
              {movimientos.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-emerald-700 bg-emerald-50 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-emerald-800">TOTALES</td>
                    <td className="px-4 py-3 text-right font-mono text-red-700">USD {fmt(totalDebitos)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">USD {fmt(totalCreditos)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-lg ${(saldoAnterior + saldoFinal) > 0 ? "text-red-700" : (saldoAnterior + saldoFinal) < 0 ? "text-emerald-700" : "text-gray-500"}`}>
                      USD {fmt(saldoAnterior + saldoFinal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </Card>

          {movimientos.length > 0 && (() => {
            const saldoReal = saldoAnterior + saldoFinal;
            return (
              <div className={`mt-3 p-3 rounded-xl text-center font-bold text-lg border-2 ${saldoReal > 0.01 ? "border-red-300 bg-red-50 text-red-700" : saldoReal < -0.01 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-300 bg-gray-50 text-gray-500"}`}>
                {saldoReal > 0.01
                  ? esCliente
                    ? `El cliente debe USD ${fmt(saldoReal)}`
                    : `Debemos al proveedor USD ${fmt(saldoReal)}`
                  : saldoReal < -0.01
                    ? esCliente
                      ? `Saldo a favor del cliente: USD ${fmt(Math.abs(saldoReal))}`
                      : `Saldo a favor nuestro con el proveedor: USD ${fmt(Math.abs(saldoReal))}`
                    : "Cuenta corriente al dia"}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ─── COTIZACIONES USD/ARS (ADMIN) ────────────────────────────────────────────

function Cotizaciones({ data, onUpdate, currentUser }) {
  const cotizaciones = Array.isArray(data?.cotizaciones) ? data.cotizaciones : [];
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAnulados, setShowAnulados] = useState(false);
  const [anularRec, setAnularRec] = useState(null);
  const [manualModal, setManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    fecha: today(),
    venta: "",
    compra: "",
    observaciones: "",
  });
  const sf = (k, v) => setManualForm(f => ({ ...f, [k]: v }));

  const refrescarBNA = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await fetchApi("/api/cotizacion/refrescar", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        setErrorMsg(j?.error || "Error al consultar BNA.");
      } else if (j?.cotizacion) {
        const fresh = await loadPersistedData();
        if (fresh) {
          if (Array.isArray(fresh.cotizaciones)) onUpdate("cotizaciones", fresh.cotizaciones);
          if (fresh.cnt) onUpdate("cnt", fresh.cnt);
        }
      }
    } catch (err) {
      setErrorMsg(`No se pudo conectar al server: ${err?.message || "fetch failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const guardarManual = async () => {
    const venta = num(manualForm.venta);
    if (venta <= 0) { alert("La venta debe ser mayor a 0."); return; }
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await fetchApi("/api/cotizacion/manual", {
        method: "POST",
        body: JSON.stringify({
          fecha: manualForm.fecha,
          venta,
          compra: num(manualForm.compra) || venta,
          observaciones: manualForm.observaciones,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErrorMsg(j?.error || "Error al guardar.");
      } else {
        const fresh = await loadPersistedData();
        if (fresh) {
          if (Array.isArray(fresh.cotizaciones)) onUpdate("cotizaciones", fresh.cotizaciones);
          if (fresh.cnt) onUpdate("cnt", fresh.cnt);
        }
        setManualModal(false);
        setManualForm({ fecha: today(), venta: "", compra: "", observaciones: "" });
      }
    } catch (err) {
      setErrorMsg(`No se pudo conectar al server: ${err?.message || "fetch failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = (motivo) => {
    onUpdate("cotizaciones", aplicarAnulacion(cotizaciones, anularRec.id, motivo, currentUser));
    setAnularRec(null);
  };

  const cotActual = getCotizacionActual(cotizaciones);
  const visibles = [...cotizaciones]
    .filter(c => showAnulados || !c.anulado)
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

  return (
    <div>
      <PageHdr title="Cotizaciones USD/ARS" sub="Tipo de cambio Banco Nación + cargas manuales" />

      {/* Cotización actual destacada */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">USD Venta (actual)</p>
          <p className="text-3xl font-bold text-emerald-800 mt-1">
            ${cotActual ? fmt(cotActual.venta, 2) : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {cotActual ? `${cotActual.fuente} · ${fmtD(cotActual.fecha)}` : "Sin cotización registrada"}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">USD Compra</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">
            ${cotActual ? fmt(cotActual.compra, 2) : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {cotActual?.fechaActualizacionApi
              ? `API: ${new Date(cotActual.fechaActualizacionApi).toLocaleString("es-AR")}`
              : "—"}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-center gap-2">
          <button
            onClick={refrescarBNA}
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-2.5">
            {loading ? "Consultando..." : "↻ Actualizar desde BNA"}
          </button>
          <button
            onClick={() => setManualModal(true)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl py-2.5">
            + Cotización manual
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex justify-end mb-3">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
          Mostrar anuladas
        </label>
      </div>

      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID", "Fecha", "Fuente", "Compra", "Venta", "Usuario", "Observaciones", ""]} />
          <tbody>
            {visibles.map(c => {
              const an = c.anulado;
              return (
                <TR key={c.id} className={an ? "opacity-50 line-through" : ""}>
                  <TD mono><span className="text-emerald-700 font-bold">{c.id}</span></TD>
                  <TD>{fmtD(c.fecha)}</TD>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.fuente === "BNA" ? "bg-emerald-100 text-emerald-700" : c.fuente === "manual" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.fuente || "—"}
                    </span>
                  </td>
                  <TD right gray>${fmt(c.compra, 2)}</TD>
                  <TD right bold>${fmt(c.venta, 2)}</TD>
                  <TD gray>{c.usuario || "—"}</TD>
                  <TD gray>{c.observaciones || "—"}</TD>
                  <Btns anulado={an} onAnular={() => setAnularRec(c)} />
                </TR>
              );
            })}
            {!visibles.length && <EmptyRow cols={8} />}
          </tbody>
        </table>
      </Card>

      {manualModal && (
        <Modal title="Cargar cotización manual" onClose={() => setManualModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Fl label="Fecha *">
              <input type="date" className={IC} value={manualForm.fecha} onChange={e => sf("fecha", e.target.value)} />
            </Fl>
            <Fl label="USD Venta *">
              <input type="number" step="0.01" className={IC} value={manualForm.venta} onChange={e => sf("venta", e.target.value)} placeholder="Ej: 1480" />
            </Fl>
            <Fl label="USD Compra (opcional)">
              <input type="number" step="0.01" className={IC} value={manualForm.compra} onChange={e => sf("compra", e.target.value)} placeholder="Ej: 1430" />
            </Fl>
            <Fl label="Observaciones" span2>
              <input type="text" className={IC} value={manualForm.observaciones} onChange={e => sf("observaciones", e.target.value)} placeholder="Motivo o referencia" />
            </Fl>
          </div>
          <FBtns onSave={guardarManual} onCancel={() => setManualModal(false)} saveLabel={loading ? "Guardando..." : "Guardar"} />
        </Modal>
      )}

      {anularRec && (
        <AnularModal
          entityLabel="Cotización"
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}

// ─── CARTERA DE CHEQUES (ADMIN) ─────────────────────────────────────────────
function ChequesCartera({ data, onUpdate, currentUser }) {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [showAnulados, setShowAnulados] = useState(false);
  const [anularRec, setAnularRec] = useState(null);
  const { cheques = [], clientes = [], proveedores = [] } = data;
  const activos = filterActive(cheques);
  const resumen30 = calcChequeCashflow(activos, 30);
  const hoy = today();
  const estadoBadge = (estado) => {
    if (estado === "cobrado") return "bg-emerald-100 text-emerald-700";
    if (estado === "rechazado") return "bg-red-100 text-red-700";
    if (estado === "anulado") return "bg-gray-200 text-gray-600";
    if (estado === "entregado_proveedor") return "bg-blue-100 text-blue-700";
    if (estado === "depositado") return "bg-violet-100 text-violet-700";
    return "bg-amber-100 text-amber-700";
  };
  const visibles = cheques
    .filter((c) => inDateRange(c.fechaVencimiento || c.fechaEmision, dateRange))
    .filter((c) => (showAnulados ? true : !c.anulado))
    .filter((c) => (estadoFilter === "all" ? true : String(c.estado || "en_cartera") === estadoFilter))
    .sort((a, b) => String(a.fechaVencimiento || "").localeCompare(String(b.fechaVencimiento || "")));

  const actualizarEstado = (cheque, estadoNuevo) => {
    const estado = CHEQUE_ESTADOS.includes(estadoNuevo) ? estadoNuevo : "en_cartera";
    const next = cheques.map((c) => String(c.id) === String(cheque.id)
      ? {
          ...c,
          estado,
          fechaEstado: new Date().toISOString(),
          anulado: estado === "anulado" ? true : !!c.anulado,
          anuladoEl: estado === "anulado" ? (c.anuladoEl || new Date().toISOString()) : c.anuladoEl,
          anuladoPor: estado === "anulado" ? (c.anuladoPor || (currentUser?.usuario || currentUser?.nombre || "—")) : c.anuladoPor,
          historialEstados: [
            ...(Array.isArray(c.historialEstados) ? c.historialEstados : []),
            {
              fecha: new Date().toISOString(),
              estado,
              usuario: currentUser?.usuario || currentUser?.nombre || "—",
              observacion: "Cambio de estado manual",
            },
          ],
        }
      : c);
    onUpdate("cheques", next, { action: "CAMBIO_ESTADO", detail: `Cheque ${cheque.id} → ${chequeEstadoLabel(estado)}` });
  };

  const handleAnular = (motivo) => {
    const next = aplicarAnulacion(cheques, anularRec.id, motivo, currentUser).map((c) => String(c.id) === String(anularRec.id)
      ? {
          ...c,
          estado: "anulado",
          fechaEstado: new Date().toISOString(),
          historialEstados: [
            ...(Array.isArray(c.historialEstados) ? c.historialEstados : []),
            {
              fecha: new Date().toISOString(),
              estado: "anulado",
              usuario: currentUser?.usuario || currentUser?.nombre || "—",
              observacion: motivo,
            },
          ],
        }
      : c);
    onUpdate("cheques", next);
    setAnularRec(null);
  };

  return (
    <div>
      <PageHdr title="Cartera de Cheques" sub="Seguimiento por vencimiento, estado e impacto en flujo de caja" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Ingresos proyectados 30d</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">USD {fmt(resumen30.ingresos)}</p>
          <p className="text-xs text-gray-500 mt-1">{resumen30.ingresosCount} cheque(s) de terceros</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-700 font-semibold uppercase tracking-wider">Salidas proyectadas 30d</p>
          <p className="text-2xl font-bold text-red-800 mt-1">USD {fmt(resumen30.salidas)}</p>
          <p className="text-xs text-gray-500 mt-1">{resumen30.salidasCount} cheque(s) a proveedores</p>
        </div>
        <div className={`border rounded-xl p-4 ${resumen30.neto >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-700">Neto proyectado 30d</p>
          <p className="text-2xl font-bold mt-1">USD {fmt(resumen30.neto)}</p>
          <p className="text-xs text-gray-500 mt-1">Calculado por fecha de vencimiento/cobro</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <DateRangeFilter range={dateRange} onChange={setDateRange} count={visibles.length} total={cheques.length} />
        <div className="flex items-center gap-2">
          <select className={IC} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            {CHEQUE_ESTADOS.map((st) => <option key={st} value={st}>{chequeEstadoLabel(st)}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showAnulados} onChange={e => setShowAnulados(e.target.checked)} className="accent-emerald-700" />
            Mostrar anulados
          </label>
        </div>
      </div>

      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID","Tipo","Número","Banco","Importe","Moneda","Emisión","Vencimiento","Origen","Destino","Estado",""]} />
          <tbody>
            {visibles.map((c) => {
              const est = String(c.estado || "en_cartera");
              const vencido = !!c.fechaVencimiento && c.fechaVencimiento < hoy && !["cobrado", "anulado", "rechazado"].includes(est);
              return (
                <TR key={c.id} className={c.anulado ? "opacity-50 line-through" : ""}>
                  <TD mono><span className="text-emerald-700 font-bold">{c.id}</span></TD>
                  <TD>{c.tipo === "propio" ? "Propio" : "Terceros"}</TD>
                  <TD mono>{c.numero || "-"}</TD>
                  <TD>{c.banco || "-"}</TD>
                  <TD right bold>{fmt(c.importe, 0)}</TD>
                  <TD>{c.moneda}</TD>
                  <TD>{fmtD(c.fechaEmision)}</TD>
                  <TD>
                    <span className={vencido ? "text-red-700 font-bold" : ""}>{fmtD(c.fechaVencimiento)}</span>
                  </TD>
                  <TD>{lookupNombre(clientes, c.clienteOrigen) || "-"}</TD>
                  <TD>{lookupNombre(proveedores, c.proveedorDestino) || "-"}</TD>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${estadoBadge(est)}`}>
                      {chequeEstadoLabel(est)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      {!c.anulado && (
                        <select className={IC_COMPACT} value={est} onChange={(e) => actualizarEstado(c, e.target.value)}>
                          {CHEQUE_ESTADOS.map((st) => <option key={st} value={st}>{chequeEstadoLabel(st)}</option>)}
                        </select>
                      )}
                      {!c.anulado ? (
                        <button
                          type="button"
                          onClick={() => setAnularRec(c)}
                          className="p-1 text-[#374151] hover:text-[#B91C1C] hover:bg-red-50 rounded-lg"
                          title="Anular"
                        >
                          <IconBan className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded">ANULADO</span>
                      )}
                    </div>
                  </td>
                </TR>
              );
            })}
            {!visibles.length && <EmptyRow cols={12} />}
          </tbody>
        </table>
      </Card>

      {anularRec && (
        <AnularModal
          entityLabel="Cheque"
          record={anularRec}
          onClose={() => setAnularRec(null)}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}

// ─── AUDITORÍA (ADMIN) ───────────────────────────────────────────────────────
function AuditoriaAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetchApi("/api/audit");
        if (r.ok) { const j = await r.json(); setLogs(j.logs || []); }
      } finally { setLoading(false); }
    })();
  }, []);

  const actionColor = (action) => {
    const a = String(action || "").toUpperCase();
    if (a === "LOGIN") return "bg-blue-100 text-blue-700";
    if (a === "LOGOUT") return "bg-gray-100 text-gray-600";
    if (a.includes("CREA") || a === "CREATE") return "bg-emerald-100 text-emerald-700";
    if (a.includes("EDIT") || a.includes("UPDAT") || a === "UPDATE") return "bg-amber-100 text-amber-700";
    if (a.includes("ELIM") || a.includes("DELET") || a === "DELETE") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#17211B]">Historial de actividad</h2>
        <p className="text-sm text-[#6B7280] mt-0.5">Registro de todas las acciones realizadas en el sistema.</p>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-[#6B7280] text-sm">Cargando historial…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-[#6B7280] text-sm">No hay registros todavía.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAF8]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Fecha y hora</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Acción</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Módulo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAF8] transition-colors">
                  <td className="px-5 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-[#17211B]">{log.userName || "—"}</td>
                  <td className="px-5 py-3">
                    {log.userRole === "ADMIN"
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1F7A4D]/15 text-[#1F7A4D]">ADMIN</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">VENDEDOR</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${actionColor(log.action)}`}>{log.action || "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-[#374151] text-xs font-medium">{log.entity || "—"}</td>
                  <td className="px-5 py-3 text-[#6B7280] text-xs max-w-xs truncate">{log.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(() => normalizeData(SEED));
  const [loaded, setLoaded] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const [navTarget, setNavTarget] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [jwtUser, setJwtUser] = useState(null);    // { id, username, nombre, role }
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarNavScroll = useRef({ mobile: 0, desktop: 0 });
  const closeSidebar = () => setSidebarOpen(false);

  // Verificar sesión guardada al arrancar
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          const r = await fetchApi("/auth/me");
          if (r.ok) { const json = await r.json(); setJwtUser(json.user); }
          else setToken(null);
        } catch { setToken(null); }
      }
      setAuthChecked(true);
    })();
  }, []);

  // Evitar que la rueda del mouse cambie inputs numéricos al hacer scroll
  useEffect(() => {
    const onWheel = (e) => {
      const a = document.activeElement;
      if (a && a.tagName === "INPUT" && a.type === "number" && a === e.target) {
        a.blur();
      }
    };
    document.addEventListener("wheel", onWheel, { passive: true });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);

  // Cargar datos solo cuando hay sesión activa
  useEffect(() => {
    if (!authChecked || !jwtUser) return;
    (async () => {
      try {
        const raw = await loadPersistedData();
        if (raw) setData(normalizeData(raw));
      } catch {
        setData(normalizeData(SEED));
      }
      setLoaded(true);
    })();
  }, [authChecked, jwtUser]);

  useEffect(() => {
    if (!loaded) return;
    persistData(data);
  }, [data, loaded]);

  // Sincroniza la última cotización en segundo plano para mostrar TC actualizado
  // en toda la app sin necesidad de recargar.
  useEffect(() => {
    if (!loaded || !jwtUser) return;
    let stop = false;

    const pullCotizacionActual = async () => {
      try {
        const r = await fetchApi("/api/cotizacion/actual");
        if (!r.ok) return;
        const j = await r.json();
        let cot = j?.cotizacion;
        if (!cot) {
          const rr = await fetchApi("/api/cotizacion/refrescar", { method: "POST" });
          if (!rr.ok) return;
          const jj = await rr.json();
          cot = jj?.cotizacion || null;
        }
        if (!cot || stop) return;

        setData((prev) => {
          const prevCotizaciones = Array.isArray(prev?.cotizaciones) ? prev.cotizaciones : [];
          const exists = prevCotizaciones.some((c) => String(c?.id || "") === String(cot?.id || ""));
          if (exists) return prev;

          const seq = Number(String(cot?.id || "").match(/^COT_(\d+)/)?.[1] || 0);
          const prevCnt = prev?.cnt && typeof prev.cnt === "object" ? prev.cnt : {};
          const nextCnt = { ...prevCnt, cot: Math.max(num(prevCnt.cot), seq) };
          return normalizeData({ ...prev, cotizaciones: [...prevCotizaciones, cot], cnt: nextCnt });
        });
      } catch {
        void 0;
      }
    };

    pullCotizacionActual();
    const timer = setInterval(pullCotizacionActual, 60 * 1000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [loaded, jwtUser]);

  // El rol y la identidad vienen del JWT (autenticación real)
  const currentRole = jwtUser ? String(jwtUser.role).toLowerCase() : "vendedor";
  const currentUser = jwtUser
    ? { id: jwtUser.id, nombre: jwtUser.nombre, usuario: jwtUser.username, rol: currentRole }
    : null;

  const handleLogin = (user) => { setJwtUser(user); setLoaded(false); };
  const handleLogout = () => {
    setToken(null);
    setJwtUser(null);
    setLoaded(false);
    setData(normalizeData(SEED));
    setPage("dashboard");
    setActiveNav("dashboard");
  };

  const navItemForPage = (nextPage, role = currentRole) =>
    NAV.find((item) => item.page === nextPage && item.group === "principal" && canSeeNavItem(role, item))
    || NAV.find((item) => item.page === nextPage && canSeeNavItem(role, item));

  useEffect(() => {
    const current = NAV.find((item) => item.id === activeNav && item.page === page);
    if (current) return;
    const fallback = navItemForPage(page, currentRole);
    if (fallback) setActiveNav(fallback.id);
  }, [page, activeNav, currentRole]);

  useEffect(() => {
    if (canAccessPage(currentRole, page)) return;
    setPage("dashboard");
    setActiveNav("dashboard");
  }, [currentRole, page]);

  const ENTITY_LABELS = {
    operaciones: "Operación", facturas: "Factura", remitos: "Remito",
    recibos: "Recibo / Cobro", compras: "Compra", remitosCompra: "Remito compra",
    facturasCompra: "Factura compra", recibosCompra: "Recibo compra", costos: "Costo",
    clientes: "Cliente", productos: "Producto", vendedores: "Vendedor",
    stock: "Stock", maestros: "Maestros", cheques: "Cheque",
  };

  const formatRecordDetail = (rec, key, d) => {
    if (!rec) return "";
    const fmtN = (v) => num(v).toLocaleString("es-AR", { maximumFractionDigits: 2 });
    switch (key) {
      case "compras": {
        const prov = lookupNombre(d.proveedores, rec.proveedorId);
        const prod = lookupNombre(d.productos, rec.productoId);
        const total = num(rec.cantidad) * num(rec.precio);
        return `${rec.id || ""} · ${fmtN(rec.cantidad)} ${prod} · proveedor ${prov} · ${rec.moneda || "USD"} ${fmtN(total)}`;
      }
      case "remitosCompra": {
        const prov = lookupNombre(d.proveedores, rec.proveedorId);
        const prod = lookupNombre(d.productos, rec.productoId);
        return `${rec.id || ""} · ${rec.compraId || rec.compraBaseId || "-"} · ${fmtN(rec.cantidad)} ${prod} · ${prov}`;
      }
      case "facturasCompra": {
        const prov = lookupNombre(d.proveedores, rec.proveedorId);
        const prod = lookupNombre(d.productos, rec.productoId);
        const total = facCompraTotalUSD(rec, d.productos);
        return `${rec.id || ""} · ${rec.compraId || rec.compraBaseId || "-"} · ${fmtN(rec.cantidad)} ${prod} · ${prov} · USD ${fmtN(total)}`;
      }
      case "recibosCompra": {
        const prov = lookupNombre(d.proveedores, rec.proveedorId);
        return `${rec.id || ""} · ${prov} · ${rec.moneda || ""} ${fmtN(rec.monto)} · ${medioPagoLabel(rec.medioPago)}`;
      }
      case "facturas": {
        const cli = lookupNombre(d.clientes, rec.clienteId);
        const prod = lookupNombre(d.productos, rec.productoId);
        const total = num(rec.cantidad) * num(rec.precioUnit);
        return `${rec.id || ""} · ${cli} · ${fmtN(rec.cantidad)} ${prod} · USD ${fmtN(total)}`;
      }
      case "operaciones": {
        const cli = lookupNombre(d.clientes, rec.clienteId);
        const prod = lookupNombre(d.productos, rec.productoId);
        const total = num(rec.cantidad) * num(rec.precio);
        return `${rec.id || ""} · ${cli} · ${fmtN(rec.cantidad)} ${prod} · USD ${fmtN(total)}`;
      }
      case "recibos": {
        const cli = lookupNombre(d.clientes, rec.clienteId);
        return `${rec.id || ""} · ${cli} · ${rec.moneda || ""} ${fmtN(rec.monto)} · ${medioPagoLabel(rec.medioPago)}`;
      }
      case "remitos": {
        const prod = lookupNombre(d.productos, rec.productoId);
        return `${rec.id || ""} · ${fmtN(rec.cantidad)} ${prod}${rec.lote ? ` · lote ${rec.lote}` : ""}`;
      }
      case "costos": {
        return `${rec.descripcion || rec.concepto || rec.id || ""} · $${fmtN(rec.monto)}`;
      }
      case "cheques":
        return `${rec.id || ""} · ${rec.numero || "s/n"} · ${rec.banco || "banco"} · ${fmtN(rec.importe)} ${rec.moneda || ""} · ${chequeEstadoLabel(rec.estado)}`;
      case "clientes":
        return `${rec.nombre || ""}${rec.cuit ? ` · CUIT ${rec.cuit}` : ""}${hasValue(rec.vendedorId) ? ` · vendedor ${lookupNombre(d.vendedores, rec.vendedorId)}` : ""}`;
      case "productos":
        return `${rec.nombre || ""}${rec.precio ? ` · USD ${fmtN(rec.precio)}` : ""}`;
      case "vendedores":
      case "proveedores":
        return rec.nombre || rec.id || "";
      default: {
        const name = rec.nombre || rec.numero || "";
        return name && rec.id ? `${rec.id} · ${name}` : (name || String(rec.id || ""));
      }
    }
  };

  const onUpdate = (key, val, meta = {}) => {
    const skipAudit = key === "auditoria" || key === "cnt" || meta?.skipAudit;

    if (!skipAudit) {
      const prevArr = Array.isArray(data[key]) ? data[key] : null;
      const nextArr = Array.isArray(val) ? val : null;
      let action = meta.action;
      let detail = meta.detail || "";

      if (prevArr !== null && nextArr !== null) {
        if (!action) {
          if (nextArr.length > prevArr.length) action = "CREAR";
          else if (nextArr.length < prevArr.length) action = "ELIMINAR";
          else action = "EDITAR";
        }

        if (!detail) {
          let rec = null;
          if (action === "CREAR") {
            const prevIds = new Set(prevArr.map((r) => String(r.id)));
            rec = nextArr.find((r) => !prevIds.has(String(r.id)));
          } else if (action === "ELIMINAR") {
            const nextIds = new Set(nextArr.map((r) => String(r.id)));
            rec = prevArr.find((r) => !nextIds.has(String(r.id)));
          } else {
            rec = nextArr.find((r) => {
              const prev = prevArr.find((p) => String(p.id) === String(r.id));
              return prev && JSON.stringify(r) !== JSON.stringify(prev);
            });
          }
          detail = formatRecordDetail(rec, key, data);
        }
      }

      logAudit(
        action || "MODIFICAR",
        ENTITY_LABELS[key] || key,
        String(meta.entityId || ""),
        detail,
      );
    }

    setData((d) => normalizeData({ ...d, [key]: val }));
  };

  const onNavigate = (module, id) => {
    if (!module || !id) return;
    if (!canAccessPage(currentRole, module)) return;
    setPage(module);
    const navMatch = navItemForPage(module, currentRole);
    if (navMatch) setActiveNav(navMatch.id);
    setNavTarget({ module, id: String(id), ts: Date.now() });
  };
  const onNavClick = (item) => {
    if (!canSeeNavItem(currentRole, item)) return;
    setActiveNav(item.id);
    setPage(item.page);
    setNavTarget(null);
  };
  const logoSrc = LOGO_CANDIDATES[logoIndex];
  const hasLogo = Boolean(logoSrc);
  const navPrimary = NAV.filter((item) => item.group === "principal" && canSeeNavItem(currentRole, item));
  const navExtra = NAV.filter((item) => item.group === "extra" && canSeeNavItem(currentRole, item));

  // Verificando sesión...
  if (!authChecked) return (
    <div className="h-screen flex items-center justify-center bg-[#F6F8F5]">
      <div className="text-center"><div className="text-2xl mb-4 font-extrabold text-[#1F7A4D] tracking-wide">LDS</div><p className="text-[#6B7280] font-medium">Cargando...</p></div>
    </div>
  );

  // Sin sesión → pantalla de login
  if (!jwtUser) return <LoginScreen onLogin={handleLogin} />;

  // Cargando datos después del login
  if (!loaded) return (
    <div className="h-screen flex items-center justify-center bg-[#F6F8F5]">
      <div className="text-center"><div className="text-2xl mb-4 font-extrabold text-[#1F7A4D] tracking-wide">LDS</div><p className="text-[#6B7280] font-medium">Cargando LDS AGRO ERP...</p></div>
    </div>
  );

  const DashboardForRole = currentRole === "admin" ? Dashboard : DashboardVendedor;
  const modules = { dashboard: DashboardForRole, operaciones: Operaciones, facturacion: Facturacion, remitos: Remitos, recibos: Recibos, notascredito: NotasCredito, notasdebito: NotasDebito, estadocuenta: EstadoCuenta, compras: Compras, stock: Stock, costos: Costos, ocr: OCR, maestros: Maestros, usuarios: UsuariosAdmin, auditoria: AuditoriaAdmin, cotizaciones: Cotizaciones, cheques: ChequesCartera };
  const Page = modules[page] || DashboardForRole;

  // Bottom nav: los 4 más usados + icono "más" para abrir drawer
  const bottomNavItems = navPrimary.slice(0, 4);
  const currentPageLabel = NAV.find(i => i.id === activeNav)?.label || "";
  const cotizacionActual = getCotizacionActual(data?.cotizaciones || []);
  const tcActualNum = num(cotizacionActual?.venta);
  const tcActual = tcActualNum > 0 ? tcActualNum : TC_FALLBACK;
  const tcLabel = `T/C = ${fmt(tcActual, 2)}`;

  // Contenido del sidebar (compartido entre desktop y drawer móvil)
  const SidebarContent = ({ mobile = false }) => {
    const navScrollRef = useRef(null);
    const scrollKey = mobile ? "mobile" : "desktop";
    useLayoutEffect(() => {
      const el = navScrollRef.current;
      if (!el) return;
      el.scrollTop = sidebarNavScroll.current[scrollKey] || 0;
    });
    return (
    <>
      <div className="px-3 py-4 border-b border-[#2A6A49]/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-center overflow-hidden flex-shrink-0">
            {hasLogo ? (
              <img src={logoSrc} alt="Logo LDS Agro" className="w-full h-full object-contain" onError={() => setLogoIndex(i => i + 1)} />
            ) : (
              <span className="text-emerald-200 font-black text-sm tracking-wide">LDS</span>
            )}
          </div>
          <div className={`min-w-0 overflow-hidden transition-all duration-300 ${mobile ? "opacity-100 max-w-44" : "max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100"}`}>
            <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">LDS AGRO</p>
            <p className="text-emerald-200/80 text-xs whitespace-nowrap">ERP de gestión</p>
          </div>
          {mobile && (
            <button onClick={closeSidebar} className="ml-auto text-emerald-300 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <nav
        ref={navScrollRef}
        onScroll={(e) => { sidebarNavScroll.current[scrollKey] = e.currentTarget.scrollTop; }}
        className="flex-1 py-3 px-2 space-y-3 overflow-y-auto"
      >
        <div className="space-y-1">
          {navPrimary.map(item => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => { onNavClick(item); if (mobile) closeSidebar(); }}
                className={`w-full flex items-center gap-3 ${mobile ? "justify-start px-3" : "justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-3 px-2.5 group-hover/sidebar:px-3"} py-2.5 rounded-2xl text-sm font-semibold text-left transition-all ${active ? "bg-[#DFF5E8] text-[#14532D]" : "text-emerald-100 hover:bg-white/10 hover:text-white"}`}>
                <span className="flex-shrink-0"><Icon className="w-5 h-5" /></span>
                <span className={`min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ${mobile ? "opacity-100 max-w-44" : "max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        {navExtra.length > 0 && (
          <div className="pt-3 border-t border-[#2A6A49]/50">
            <p className={`px-2.5 text-[10px] uppercase tracking-widest text-emerald-200/70 mb-2 overflow-hidden whitespace-nowrap transition-all duration-300 ${mobile ? "opacity-100 max-w-44" : "max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100"}`}>
              Gestión
            </p>
            <div className="space-y-1">
              {navExtra.map(item => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button key={item.id} onClick={() => { onNavClick(item); if (mobile) closeSidebar(); }}
                    className={`w-full flex items-center gap-3 ${mobile ? "justify-start px-3" : "justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-3 px-2.5 group-hover/sidebar:px-3"} py-2.5 rounded-2xl text-sm font-semibold text-left transition-all ${active ? "bg-[#DFF5E8] text-[#14532D]" : "text-emerald-100 hover:bg-white/10 hover:text-white"}`}>
                    <span className="flex-shrink-0"><Icon className="w-5 h-5" /></span>
                    <span className={`min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ${mobile ? "opacity-100 max-w-44" : "max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-[#2A6A49]/60 space-y-1">
        <div className={`flex items-center gap-2 ${mobile ? "justify-start" : "justify-center group-hover/sidebar:justify-start"} px-2 py-2`}>
          <div className="w-7 h-7 bg-[#1F7A4D] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{(jwtUser?.nombre || jwtUser?.username || "U").charAt(0).toUpperCase()}</span>
          </div>
          <div className={`min-w-0 overflow-hidden transition-all duration-300 ${mobile ? "opacity-100 max-w-44" : "max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100"}`}>
            <p className="text-white text-xs font-semibold whitespace-nowrap truncate leading-tight">{jwtUser?.nombre || jwtUser?.username}</p>
            <p className="text-emerald-300 text-[10px] whitespace-nowrap">{ROLE_LABELS[currentRole] || currentRole}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-2 ${mobile ? "justify-start px-3" : "justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-2 px-2 group-hover/sidebar:px-3"} py-2 rounded-xl text-emerald-400 hover:bg-red-900/40 hover:text-red-300 transition-all`}
          title="Cerrar sesión">
          <span className="flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </span>
          <span className={`min-w-0 overflow-hidden whitespace-nowrap text-xs transition-all duration-300 ${mobile ? "opacity-100 max-w-44" : "max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100"}`}>
            Cerrar sesión
          </span>
        </button>
      </div>
    </>
    );
  };

  return (
    <div className="flex h-screen bg-[#F6F8F5] font-sans overflow-hidden">
      {/* ── Overlay oscuro en móvil cuando el drawer está abierto ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* ── Drawer móvil (desliza desde la izquierda) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#14532D] to-[#1D4B35] flex flex-col border-r border-[#1F7A4D]/45 shadow-2xl transition-transform duration-300 md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent mobile />
      </aside>

      {/* ── Sidebar de escritorio (hover para expandir) ── */}
      <aside className="group/sidebar hidden md:flex relative w-[78px] hover:w-[284px] bg-gradient-to-b from-[#14532D] to-[#1D4B35] flex-col flex-shrink-0 border-r border-[#1F7A4D]/45 shadow-[0_10px_28px_rgba(20,83,45,0.35)] transition-all duration-300">
        <SidebarContent mobile={false} />
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar solo en móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200">
            <Menu className="w-5 h-5" />
          </button>
          <p className="flex-1 font-bold text-emerald-800 text-sm truncate">{currentPageLabel}</p>
          <span className="text-[10px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-full px-2 py-0.5">
            {tcLabel}
          </span>
          <div className="w-7 h-7 bg-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{(jwtUser?.nombre || jwtUser?.username || "U").charAt(0).toUpperCase()}</span>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto bg-[#F6F8F5] pb-20 md:pb-0">
          <div className="w-full px-4 py-4 sm:px-5 sm:py-5 lg:px-7">
            <div className="hidden md:flex justify-end sticky top-2 z-20 mb-2 pointer-events-none">
              <div className="bg-white/95 border border-emerald-200 rounded-full px-2.5 py-1 text-[11px] md:text-xs font-semibold text-emerald-800 shadow-sm">
                {tcLabel}
              </div>
            </div>
            <RoleContext.Provider value={currentRole}>
              <Page
                data={data}
                onUpdate={onUpdate}
                onNavigate={onNavigate}
                navTarget={navTarget}
                currentUser={currentUser}
                currentRole={currentRole}
                jwtUser={jwtUser}
              />
            </RoleContext.Provider>
          </div>
        </main>

        {/* Bottom navigation bar (solo móvil) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex items-stretch h-16 safe-area-bottom">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => onNavClick(item)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${active ? "text-emerald-700" : "text-gray-400 hover:text-gray-600"}`}>
                <Icon className={`w-5 h-5 ${active ? "text-emerald-700" : ""}`} />
                <span className="truncate max-w-full px-0.5">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
          {/* Botón "más" para abrir el drawer */}
          <button onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-400 hover:text-gray-600">
            <Menu className="w-5 h-5" />
            <span>Más</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

