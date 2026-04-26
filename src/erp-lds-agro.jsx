import { Fragment, useState, useEffect, useRef } from "react";
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
  Users,
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
  usuarios: [
    { id: 1, nombre: "Administrador", usuario: "admin", password: "admin123", rol: "admin", activo: true },
    { id: 2, nombre: "Vendedor", usuario: "vendedor", password: "vendedor123", rol: "vendedor", activo: true },
  ],
  sesion: { usuarioId: 1 },
  auditoria: [],
  cnt: { op: 2, fac: 2, rem: 2, rec: 2, oc: 2, cos: 0, cli: 2, prov: 2, prod: 5, vend: 4 },
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
const moneyToUSD = (monto, moneda, tc, fallbackTc = 1) => {
  const m = String(moneda || "").toUpperCase();
  if (m === "DOLAR" || m === "USD") return num(monto);
  return num(monto) / (num(tc) || num(fallbackTc) || 1);
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
  const byId = facturas.find((f) => String(f.id) === ref);
  const baseId = byId ? facturaBaseId(byId) : ref;
  const lines = facturas.filter((f) => facturaBaseId(f) === baseId);
  if (lines.length) return lines;
  return byId ? [byId] : [];
};

const facturaCobradaUSD = (factura, recibos, facturas = [], productos = []) => {
  if (!factura) return 0;
  const allFacturas = Array.isArray(facturas) && facturas.length ? facturas : [factura];
  const baseId = facturaBaseId(factura);
  const lines = allFacturas.filter((f) => facturaBaseId(f) === baseId);
  const targetLines = lines.length ? lines : [factura];
  const isMulti = targetLines.length > 1;

  const directByLine = new Map(
    targetLines.map((line) => [
      line.id,
      recibos
        .filter((r) => String(r.facturaId || "") === String(line.id))
        .reduce((s, r) => s + reciboUSD(r), 0),
    ]),
  );

  let basePool = recibos
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
  const facturasOp = facturas.filter(f => f.opId === op.id);
  const remitado = remitos.filter(r => r.opId === op.id).reduce((s, r) => s + num(r.cantidad), 0);
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

// ─── ATOM COMPONENTS ─────────────────────────────────────────────────────────
const STATUS_CLS = {
  "OK": "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
  "Pagado": "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
  "Completa": "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]",
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl border border-[#E5ECE7] shadow-[0_24px_48px_rgba(23,33,27,0.22)] w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5ECE7] sticky top-0 bg-white z-10">
          <h3 className="font-bold text-[#17211B]">{title}</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">×</button>
        </div>
        <div className="p-6">{children}</div>
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

function PageHdr({ title, sub, onNew, btn = "+ Nuevo" }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[#17211B]">{title}</h1>
        {sub && <p className="text-sm text-[#6B7280] mt-0.5">{sub}</p>}
      </div>
      {onNew && <button onClick={onNew} className="bg-[#1F7A4D] hover:bg-[#14532D] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0">{btn}</button>}
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

function TR({ children, highlight, rowRef }) {
  return <tr ref={rowRef} className={`border-b border-[#F0F3EF] transition-colors text-center ${highlight ? "bg-[#FFF7ED]/70" : "hover:bg-[#F6F8F5]"}`}>{children}</tr>;
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

function Btns({ onEdit, onDel, compact = false }) {
  const tdCls = compact ? "px-1.5 py-1.5 text-center" : "px-3 py-2.5";
  const btnCls = compact ? "p-1 text-[#374151] hover:text-[#111827] hover:bg-slate-100 rounded-lg" : "p-1.5 text-[#374151] hover:text-[#111827] hover:bg-slate-100 rounded-lg";
  const delBtnCls = compact ? "p-1 text-[#374151] hover:text-[#B91C1C] hover:bg-red-50 rounded-lg" : "p-1.5 text-[#374151] hover:text-[#B91C1C] hover:bg-red-50 rounded-lg";
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
function Operaciones({ data, onUpdate }) {
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
  const cascadeDeleteByOpIds = (opIds = [], msg = "Eliminar operacion y comprobantes asociados?") => {
    const ids = Array.from(new Set((opIds || []).map((x) => String(x))));
    if (!ids.length) return;
    if (!confirm(msg)) return;

    const opIdSet = new Set(ids);
    const facturasBorradas = facturas.filter((f) => opIdSet.has(String(f.opId)));
    const facturaIdSet = new Set(facturasBorradas.map((f) => String(f.id)));
    const facturaBaseSet = new Set(
      facturasBorradas.map((f) => String(facturaBaseId(f))).filter(Boolean),
    );

    const nextOperaciones = operaciones.filter((o) => !opIdSet.has(String(o.id)));
    const nextFacturas = facturas.filter((f) => !opIdSet.has(String(f.opId)));
    const nextRemitos = remitos.filter((r) => !opIdSet.has(String(r.opId)));
    const nextRecibos = recibos.filter((r) => {
      const rid = String(r.facturaId || "");
      const rbase = String(r.facturaBaseId || "");
      if (facturaIdSet.has(rid)) return false;
      if (facturaBaseSet.has(rid)) return false;
      if (rbase && facturaBaseSet.has(rbase)) return false;
      return true;
    });

    onUpdate("operaciones", nextOperaciones);
    onUpdate("facturas", nextFacturas);
    onUpdate("remitos", nextRemitos);
    onUpdate("recibos", nextRecibos);
  };

  const del = (id) => {
    cascadeDeleteByOpIds([id], "Eliminar operacion y todos sus comprobantes asociados?");
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
    onUpdate("recibos", [...recibos, {
      id: `RC_${pad4(n)}`,
      fecha: qRec.fecha,
      clienteId,
      facturaId: qRec.facturaId || "",
      ...(isFacturaBase ? { facturaBaseId: qRec.facturaId } : {}),
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
      ? `Eliminar operacion ${group.key} completa y todos sus comprobantes asociados (${group.lines.length} productos)?`
      : "Eliminar operacion y todos sus comprobantes asociados?";
    cascadeDeleteByOpIds(group.lines.map((l) => l.id), msg);
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
                                const facPendId = facturaPendienteParaOps(opIds, "group");
                                setQRec({
                                  clienteId: head.clienteId || "",
                                  facturaId: facPendId || "",
                                  concepto: `Cobro ${group.key}`,
                                  monto: facPendId ? montoAutoCobro(facPendId) : "",
                                  moneda: "DOLAR",
                                  tc: 1400,
                                  medioPago: "EFECTIVO",
                                  fecha: today(),
                                  _opId: group.key,
                                  _opIds: opIds,
                                  _scope: "group",
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
                            const opIds = [op.id];
                            const facPendId = facturaPendienteParaOps(opIds, "detail");
                            setQRec({
                              clienteId: op.clienteId,
                              facturaId: facPendId || "",
                              concepto: `Cobro ${op.id}`,
                              monto: facPendId ? montoAutoCobro(facPendId) : "",
                              moneda: "DOLAR",
                              tc: 1400,
                              medioPago: "EFECTIVO",
                              fecha: today(),
                              _opId: op.id,
                              _opIds: opIds,
                              _scope: "detail",
                            });
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
                          <THead compact center green cols={["ID", "Producto", "Cantidad", "P.USD", "Total", "Prog.", "Acciones", ""]} />
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
                                        const opIds = [op.id];
                                        const facPendId = facturaPendienteParaOps(opIds, "detail");
                                        setQRec({
                                          clienteId: op.clienteId,
                                          facturaId: facPendId || "",
                                          concepto: `Cobro ${op.id}`,
                                          monto: facPendId ? montoAutoCobro(facPendId) : "",
                                          moneda: "DOLAR",
                                          tc: 1400,
                                          medioPago: "EFECTIVO",
                                          fecha: today(),
                                          _opId: op.id,
                                          _opIds: opIds,
                                          _scope: "detail",
                                        });
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
            <Fl label="Cliente *"><SelCliente val={form.clienteId} onChange={e => sf("clienteId", e.target.value)} clientes={clientesPorVendedor} /></Fl>
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
            const facOptions = qRec._scope === "group"
              ? Array.from(new Set(facList.map((f) => facturaBaseId(f))))
                .map((id) => ({ id, saldo: saldoFacturaUSD(id) }))
                .filter((x) => x.saldo > 0.01 || x.id === qRec.facturaId)
              : facList
                .map((f) => ({ id: f.id, saldo: facSaldo(f, recibos, productos, facturas) }))
                .filter((x) => x.saldo > 0.01 || x.id === qRec.facturaId);
            return (
          <div className="grid grid-cols-2 gap-4">
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
                  }));
                }}
              />
            </Fl>
            <Fl label="Moneda">
              <select className={IC} value={qRec.moneda} onChange={e => setQRec(r => ({ ...r, moneda: e.target.value }))}>
                <option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option>
              </select>
            </Fl>
            <Fl label="Tipo de Cambio"><input type="number" className={IC} value={qRec.tc} onChange={e => setQRec(r => ({ ...r, tc: e.target.value }))} /></Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={`${IC} no-spin`} value={qRec.monto} onWheel={e => e.currentTarget.blur()} onChange={e => setQRec(r => ({ ...r, monto: e.target.value }))} /></Fl>
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

// ─── FACTURACION ──────────────────────────────────────────────────────────────
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
    g.cobrado = g.lines.reduce((s, x) => s + facturaCobradaUSD(x, recibos, facturas, productos), 0);
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
          <THead cols={["","ID","Fecha","Operacion","Cliente","Producto","Cantidad","Precio","IVA","Total c/IVA","Cobrado","Saldo","Vence","Estado",""]} />
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
                          <THead cols={["ID","Operacion","Producto","Cantidad","Precio","IVA","Total","Cobrado","Saldo","Vence","Estado",""]} />
                          <tbody>
                            {group.lines.map((f) => {
                              const totalL = facTotal(f, productos);
                              const cobradoL = facturaCobradaUSD(f, recibos, facturas, productos);
                              const saldoL = facSaldo(f, recibos, productos, facturas);
                              const stL = facStatus(f, recibos, productos, facturas);
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
                onChange={e => setForm((prev) => ({ ...prev, clienteId: e.target.value, opId: "", productoId: "", cantidad: "", precioUnit: "" }))}
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
                  return {
                    value: String(o.id),
                    label: `${baseLabel} - pend. ${pend} u.`,
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

// ─── REMITOS ──────────────────────────────────────────────────────────────────
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
              <SearchSelect
                value={form.opId || ""}
                placeholder="Seleccionar..."
                options={operaciones.map((o) => {
                  const tracks = opTracks(o, facturas, remitos, recibos, productos);
                  return {
                    value: String(o.id),
                    label: `${opSelectLabel(o, data.clientes, productos)} - pend. ${tracks.pendEntrega} u.`,
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
    </div>
  );
}

// ─── RECIBOS ──────────────────────────────────────────────────────────────────
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
      const saldo = facSaldo(fac, recibos.filter(r => r.id !== editId), productos, facturas);
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
  const saldoFacturaSel = facturaSel ? facSaldo(facturaSel, recibos.filter(r => r.id !== editId), productos, facturas) : 0;
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
              <SearchSelect
                value={form.facturaId || ""}
                placeholder="Sin vincular"
                options={facturas
                  .filter((f) => {
                    if (form.clienteId) {
                      const cli = facturaClienteId(f.id);
                      if (+cli !== +form.clienteId && f.id !== form.facturaId) return false;
                    }
                    return facSaldo(f, recibos.filter(r => r.id !== editId), productos, facturas) > 0.01 || f.id === form.facturaId;
                  })
                  .map((f) => {
                    const saldo = facSaldo(f, recibos.filter(r => r.id !== editId), productos, facturas);
                    return {
                      value: String(f.id),
                      label: `${f.id} - saldo USD ${fmt(saldo)}`,
                      searchText: `${f.id} ${fmt(saldo)} ${lookupNombre(clientes, facturaClienteId(f.id))}`,
                    };
                  })}
                clearable
                clearLabel="Sin vincular"
                emptyLabel="Sin facturas pendientes"
                onChange={(facturaId) => {
                  const nextId = String(facturaId || "");
                  const clienteId = nextId ? facturaClienteId(nextId) : form.clienteId;
                  const saldoFactura = nextId
                    ? facSaldo(facturas.find((x) => x.id === nextId), recibos.filter(r => r.id !== editId), productos, facturas)
                    : 0;
                  setForm((f) => ({
                    ...f,
                    facturaId: nextId,
                    clienteId: clienteId || f.clienteId,
                    monto: nextId ? Number(saldoFactura.toFixed(2)) : f.monto,
                  }));
                }}
              />
            </Fl>
            <Fl label="Medio de Pago">
              <select className={IC} value={form.medioPago || "EFECTIVO"} onChange={e => sf("medioPago", e.target.value)}>
                {["EFECTIVO","TRANSFERENCIA","TARJETA","CHEQUE"].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fl>
            <Fl label="Moneda"><select className={IC} value={form.moneda || "PESOS"} onChange={e => sf("moneda", e.target.value)}><option value="PESOS">PESOS</option><option value="DOLAR">DOLAR</option></select></Fl>
            <Fl label="Tipo de Cambio"><input type="number" className={IC} value={form.tc || ""} onChange={e => sf("tc", e.target.value)} /></Fl>
            <Fl label="Monto *"><input type="number" step="0.01" className={`${IC} no-spin`} value={form.monto || ""} onWheel={e => e.currentTarget.blur()} onChange={e => sf("monto", e.target.value)} /></Fl>
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

// ─── COMPRAS ──────────────────────────────────────────────────────────────────
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
          <THead cols={["ID","Fecha","Proveedor","Producto","Cantidad","Precio","Total","Recibido","Pagado","Saldo","Estado",""]} />
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

// ─── STOCK ────────────────────────────────────────────────────────────────────
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

// ─── COSTOS ───────────────────────────────────────────────────────────────────
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

function Dashboard({ data, onNavigate, currentUser }) {
  const [query, setQuery] = useState("");
  const { operaciones, facturas, remitos, recibos, compras, productos, costos = [] } = data;
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
  for (const op of operaciones) {
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
      const t = opTracks(op, facturas, remitos, recibos, productos);
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
    const lineFacturas = facturas.filter((f) => g.lines.some((op) => op.id === f.opId));
    const hasVencido = lineFacturas.some((f) => {
      const due = parseDate(f.fechaCobro);
      const saldo = facSaldo(f, recibos, productos, facturas);
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

  const ventasMesUSD = facturas
    .filter((f) => isSameMonth(f.fecha))
    .reduce((s, f) => s + facTotal(f, productos), 0);

  const facturaPendByBase = new Map();
  for (const f of facturas) {
    const base = facturaBaseId(f);
    const saldo = facSaldo(f, recibos, productos, facturas);
    facturaPendByBase.set(base, num(facturaPendByBase.get(base)) + saldo);
  }
  const facturasPend = Array.from(facturaPendByBase.entries()).filter(([, saldo]) => saldo > 0.01);
  const cobrosPendientesUSD = facturasPend.reduce((s, [, saldo]) => s + saldo, 0);
  const facturasPendCount = facturasPend.length;

  const facturasMesCount = new Set(
    facturas
      .filter((f) => isSameMonth(f.fecha))
      .map((f) => facturaBaseId(f)),
  ).size;

  const remitosPendOps = opRows.filter((r) => r.pendRemitoFact > 0.01);
  const remitosPendCount = remitosPendOps.length;
  const remitosPendUnits = remitosPendOps.reduce((s, r) => s + r.pendRemitoFact, 0);

  const stockValorizadoUSD = productos.reduce((s, p) => {
    const stock = Math.max(0, stockProd(p.id, compras, remitos));
    const unitCost = num(p.costo) || num(p.precio);
    return s + stock * unitCost;
  }, 0);

  const costoVentasMesUSD = facturas
    .filter((f) => isSameMonth(f.fecha))
    .reduce((s, f) => {
      const p = productoById(productos, f.productoId);
      return s + num(f.cantidad) * (num(p?.costo) || 0);
    }, 0);
  const margenEstimadoPct = ventasMesUSD > 0 ? ((ventasMesUSD - costoVentasMesUSD) / ventasMesUSD) * 100 : 0;

  const salesByMonth = lastMonthKeys(6).reverse().map((key) => ({
    key,
    label: monthLabelEs(key),
    total: facturas
      .filter((f) => monthKeyFromDate(f.fecha) === key)
      .reduce((s, f) => s + facTotal(f, productos), 0),
  }));
  const maxSalesMonth = salesByMonth.reduce((mx, m) => Math.max(mx, m.total), 1);

  const cobranzasMesUSD = recibos
    .filter((r) => isSameMonth(r.fecha))
    .reduce((s, r) => s + reciboUSD(r), 0);
  const coberturaCobranzaPct = (cobranzasMesUSD + cobrosPendientesUSD) > 0
    ? (cobranzasMesUSD / (cobranzasMesUSD + cobrosPendientesUSD)) * 100
    : 0;

  const stockByCategory = Array.from(
    productos.reduce((map, p) => {
      const cat = p.tipo || "General";
      const stock = stockProd(p.id, compras, remitos);
      const prev = map.get(cat) || { categoria: cat, unidades: 0, criticos: 0, valorUSD: 0 };
      const stockPos = Math.max(0, stock);
      prev.unidades += stockPos;
      prev.criticos += stock <= 20 ? 1 : 0;
      prev.valorUSD += stockPos * (num(p.costo) || num(p.precio));
      map.set(cat, prev);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => b.valorUSD - a.valorUSD);

  const facturasVencidas = facturas.filter((f) => {
    const due = parseDate(f.fechaCobro);
    return due && due < todayDate && facSaldo(f, recibos, productos, facturas) > 0.01;
  });
  const clientesDeudaVencida = new Set(
    facturasVencidas.map((f) => {
      if (hasValue(f.clienteId)) return +f.clienteId;
      const op = operaciones.find((o) => o.id === f.opId);
      return op?.clienteId;
    }).filter(Boolean),
  ).size;
  const operacionesIncompletas = opRows.filter((r) => r.estado !== "Cobrado").length;
  const stockCriticoCount = productos.filter((p) => stockProd(p.id, compras, remitos) <= 20).length;
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
          subtitle="Valorizado a costo unitario de productos."
          tone="dark"
          Icon={Boxes}
        />
        <DashboardKPICard
          title="Margen estimado"
          value={`${fmt(margenEstimadoPct, 1)}%`}
          subtitle={`Costo estimado del mes: USD ${fmt(costoVentasMesUSD)}.`}
          tone={margenEstimadoPct >= 0 ? "green" : "red"}
          Icon={TrendingUp}
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
function Configuracion({ data, onUpdate, currentUser }) {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const sf = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const users = [...(data.usuarios || [])].sort((a, b) => num(a.id) - num(b.id));
  const logs = [...(data.auditoria || [])]
    .sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")))
    .slice(0, 400);
  const roleLabel = (role) => (String(role || "").toLowerCase() === "admin" ? "ADMIN" : "VENDEDOR");

  if (String(currentUser?.rol || "").toLowerCase() !== "admin") {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-bold text-[#17211B]">Sin permiso</h2>
        <p className="text-sm text-[#6B7280] mt-2">
          Este modulo es solo para usuarios con rol administrador.
        </p>
      </Card>
    );
  }

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: "", usuario: "", password: "", rol: "vendedor", activo: true });
    setModal(true);
  };

  const openEdit = (u) => {
    setEditId(u.id);
    setForm({ ...u, password: "" });
    setModal(true);
  };

  const save = () => {
    const nombre = String(form.nombre || "").trim();
    const usuario = String(form.usuario || "").trim();
    if (!nombre || !usuario) return alert("Completa nombre y usuario.");

    const dup = users.find((u) => String(u.usuario || "").toLowerCase() === usuario.toLowerCase() && +u.id !== +editId);
    if (dup) return alert("Ese usuario ya existe.");

    const rec = {
      id: editId || ((users.reduce((mx, u) => Math.max(mx, num(u.id)), 0) || 0) + 1),
      nombre,
      usuario,
      rol: String(form.rol || "vendedor").toLowerCase() === "admin" ? "admin" : "vendedor",
      activo: form.activo !== false,
    };

    const prev = users.find((u) => +u.id === +editId);
    if (editId) {
      rec.password = String(form.password || "") ? String(form.password) : String(prev?.password || "");
    } else {
      if (!String(form.password || "").trim()) return alert("Completa una clave para el usuario.");
      rec.password = String(form.password);
    }

    const nextUsers = editId
      ? users.map((u) => (+u.id === +editId ? rec : u))
      : [...users, rec];

    const adminsActivos = nextUsers.filter((u) => u.rol === "admin" && u.activo !== false).length;
    if (!adminsActivos) return alert("Debe quedar al menos un administrador activo.");

    onUpdate("usuarios", nextUsers, {
      action: editId ? "Actualizo usuario" : "Creo usuario",
      entity: "usuarios",
      detail: `${rec.usuario} (${roleLabel(rec.rol)})`,
    });
    setModal(false);
  };

  const del = (u) => {
    if (+u.id === +currentUser?.id) return alert("No podes eliminar el usuario con sesion activa.");
    const adminsActivos = users.filter((x) => x.rol === "admin" && x.activo !== false).length;
    if (u.rol === "admin" && adminsActivos <= 1) return alert("No podes eliminar el ultimo administrador.");
    if (!confirm(`Eliminar usuario ${u.usuario}?`)) return;
    onUpdate("usuarios", users.filter((x) => +x.id !== +u.id), {
      action: "Elimino usuario",
      entity: "usuarios",
      detail: u.usuario,
    });
  };

  return (
    <div className="space-y-5">
      <PageHdr
        title="Configuracion"
        sub="Usuarios, permisos y trazabilidad de cambios"
        onNew={openNew}
        btn="+ Nuevo Usuario"
      />

      <Card>
        <table className="w-full text-sm">
          <THead cols={["ID", "Nombre", "Usuario", "Rol", "Estado", ""]} />
          <tbody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD mono gray>{u.id}</TD>
                <TD bold>{u.nombre}</TD>
                <TD>{u.usuario}</TD>
                <TD>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${u.rol === "admin" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-violet-50 text-violet-700 border-violet-200"}`}>
                    {roleLabel(u.rol)}
                  </span>
                </TD>
                <TD>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${u.activo !== false ? "bg-[#ECFDF3] text-[#166534] border-[#B7EBC7]" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {u.activo !== false ? "Activo" : "Inactivo"}
                  </span>
                </TD>
                <Btns onEdit={() => openEdit(u)} onDel={() => del(u)} />
              </TR>
            ))}
            {!users.length && <EmptyRow cols={6} />}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-[#E5ECE7]">
          <h2 className="font-bold text-[#17211B] text-sm">Historial de Cambios</h2>
        </div>
        <table className="w-full text-sm">
          <THead cols={["Fecha y hora", "Usuario", "Rol", "Accion", "Entidad", "Detalle"]} />
          <tbody>
            {logs.map((l) => (
              <TR key={l.id}>
                <TD>{fmtDT(l.ts)}</TD>
                <TD bold>{l.usuario || "-"}</TD>
                <TD>{roleLabel(l.rol)}</TD>
                <TD>{l.accion || "-"}</TD>
                <TD>{l.entidad || "-"}</TD>
                <TD nowrap={false}>{l.detalle || "-"}</TD>
              </TR>
            ))}
            {!logs.length && <EmptyRow cols={6} />}
          </tbody>
        </table>
      </Card>

      {modal && (
        <Modal title={editId ? "Editar Usuario" : "Nuevo Usuario"} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Fl label="Nombre *"><input type="text" className={IC} value={form.nombre || ""} onChange={(e) => sf("nombre", e.target.value)} /></Fl>
            <Fl label="Usuario *"><input type="text" className={IC} value={form.usuario || ""} onChange={(e) => sf("usuario", e.target.value)} /></Fl>
            <Fl label={editId ? "Nueva clave (opcional)" : "Clave *"}><input type="password" className={IC} value={form.password || ""} onChange={(e) => sf("password", e.target.value)} /></Fl>
            <Fl label="Rol">
              <SearchSelect
                value={form.rol || "vendedor"}
                options={[
                  { value: "admin", label: "ADMIN" },
                  { value: "vendedor", label: "VENDEDOR" },
                ]}
                onChange={(v) => sf("rol", v || "vendedor")}
              />
            </Fl>
            <Fl label="Estado">
              <SearchSelect
                value={form.activo === false ? "inactivo" : "activo"}
                options={[
                  { value: "activo", label: "Activo" },
                  { value: "inactivo", label: "Inactivo" },
                ]}
                onChange={(v) => sf("activo", v !== "inactivo")}
              />
            </Fl>
          </div>
          <FBtns onSave={save} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

const NAV = [
  { id: "dashboard", page: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "principal" },
  { id: "operaciones", page: "operaciones", label: "Operaciones", icon: Briefcase, group: "principal" },
  { id: "facturacion", page: "facturacion", label: "Facturacion", icon: FileText, group: "principal" },
  { id: "remitos", page: "remitos", label: "Remitos", icon: Truck, group: "principal" },
  { id: "recibos", page: "recibos", label: "Recibos / Cobros", icon: ReceiptText, group: "principal" },
  { id: "stock", page: "stock", label: "Stock", icon: Boxes, group: "principal" },
  { id: "clientes", page: "maestros", label: "Clientes", icon: Users, group: "principal" },
  { id: "productos", page: "maestros", label: "Productos", icon: Package, group: "principal" },
  { id: "reportes", page: "dashboard", label: "Reportes", icon: BarChart3, group: "principal" },
  { id: "configuracion", page: "configuracion", label: "Configuracion", icon: Settings, group: "principal" },
  { id: "compras", page: "compras", label: "Compras", icon: ShoppingCart, group: "extra" },
  { id: "costos", page: "costos", label: "Costos", icon: Landmark, group: "extra" },
  { id: "ocr", page: "ocr", label: "Carga OCR", icon: ScanText, group: "extra" },
];

const ROLE_LABELS = {
  admin: "ADMIN",
  vendedor: "VENDEDOR",
};

const ROLE_PAGE_ACCESS = {
  admin: new Set(["dashboard", "operaciones", "facturacion", "remitos", "recibos", "stock", "compras", "costos", "ocr", "maestros", "configuracion"]),
  vendedor: new Set(["dashboard", "operaciones", "facturacion", "remitos", "recibos", "stock"]),
};

const ROLE_NAV_HIDDEN = {
  vendedor: new Set(["clientes", "productos", "reportes", "configuracion", "compras", "costos", "ocr"]),
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
    usuarios,
    sesion,
    auditoria,
    cnt,
  };
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(() => normalizeData(SEED));
  const [loaded, setLoaded] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const [navTarget, setNavTarget] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");

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

  const currentUser = (data.usuarios || []).find((u) => +u.id === +data.sesion?.usuarioId && u.activo !== false)
    || (data.usuarios || []).find((u) => u.activo !== false)
    || data.usuarios?.[0]
    || null;
  const currentRole = String(currentUser?.rol || "admin").toLowerCase();

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

  const onUpdate = (key, val, meta = {}) => setData((d) => {
    let next = normalizeData({ ...d, [key]: val });
    const skipAudit = key === "auditoria" || key === "cnt" || meta?.skipAudit;
    if (skipAudit) return next;

    const actor = (d.usuarios || []).find((u) => +u.id === +d.sesion?.usuarioId)
      || (d.usuarios || []).find((u) => u.activo !== false)
      || null;
    const auditRow = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toISOString(),
      usuarioId: actor?.id || null,
      usuario: actor?.nombre || actor?.usuario || "Sistema",
      rol: actor?.rol || "sistema",
      accion: meta.action || `Actualizo ${key}`,
      entidad: meta.entity || key,
      detalle: meta.detail || "",
    };

    next = normalizeData({
      ...next,
      auditoria: [...(next.auditoria || []), auditRow].slice(-3000),
    });
    return next;
  });

  const onChangeUser = (userId) => {
    const target = (data.usuarios || []).find((u) => +u.id === +userId && u.activo !== false);
    if (!target) return;
    onUpdate("sesion", { ...(data.sesion || {}), usuarioId: +userId }, {
      action: "Cambio de usuario",
      entity: "sesion",
      detail: `${target.usuario} (${ROLE_LABELS[target.rol] || target.rol})`,
    });
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

  if (!loaded) return (
    <div className="h-screen flex items-center justify-center bg-[#F6F8F5]">
      <div className="text-center"><div className="text-2xl mb-4 font-extrabold text-[#1F7A4D] tracking-wide">LDS</div><p className="text-[#6B7280] font-medium">Cargando LDS AGRO ERP...</p></div>
    </div>
  );

  const modules = { dashboard: Dashboard, operaciones: Operaciones, facturacion: Facturacion, remitos: Remitos, recibos: Recibos, compras: Compras, stock: Stock, costos: Costos, ocr: OCR, maestros: Maestros, configuracion: Configuracion };
  const Page = modules[page] || Dashboard;

  return (
    <div className="flex h-screen bg-[#F6F8F5] font-sans overflow-hidden">
      <aside className="group/sidebar relative w-[78px] hover:w-[284px] bg-gradient-to-b from-[#14532D] to-[#1D4B35] flex flex-col flex-shrink-0 border-r border-[#1F7A4D]/45 shadow-[0_10px_28px_rgba(20,83,45,0.35)] transition-all duration-300">
        <div className="px-3 py-4 border-b border-[#2A6A49]/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-center overflow-hidden flex-shrink-0">
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
            <div className="min-w-0 overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100 transition-all duration-300">
              <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">LDS AGRO</p>
              <p className="text-emerald-200/80 text-xs whitespace-nowrap">ERP de gestion</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-3 overflow-y-auto">
          <div className="space-y-1">
            {navPrimary.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavClick(item)}
                  className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-3 px-2.5 group-hover/sidebar:px-3 py-2.5 rounded-2xl text-sm font-semibold text-left transition-all ${
                    active
                      ? "bg-[#DFF5E8] text-[#14532D]"
                      : "text-emerald-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-[#2A6A49]/50">
            <p className="px-2.5 text-[10px] uppercase tracking-widest text-emerald-200/70 mb-2 overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
              Gestion
            </p>
            <div className="space-y-1">
              {navExtra.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavClick(item)}
                    className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-3 px-2.5 group-hover/sidebar:px-3 py-2.5 rounded-2xl text-sm font-semibold text-left transition-all ${
                      active
                        ? "bg-[#DFF5E8] text-[#14532D]"
                        : "text-emerald-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
        <div className="px-3 py-4 border-t border-[#2A6A49]/60 space-y-2">
          <div className="flex items-center justify-center group-hover/sidebar:justify-start gap-2">
            <UserCircle2 className="w-4 h-4 text-emerald-100" />
            <span className="text-emerald-100 text-xs font-semibold overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
              {currentUser?.nombre || "Usuario"}
            </span>
          </div>
          <div className="overflow-hidden max-h-0 opacity-0 group-hover/sidebar:max-h-24 group-hover/sidebar:opacity-100 transition-all duration-300">
            <select
              className="w-full text-xs rounded-lg border border-[#2A6A49] bg-[#123E2B] text-emerald-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200/40"
              value={currentUser?.id || ""}
              onChange={(e) => onChangeUser(e.target.value)}
            >
              {(data.usuarios || [])
                .filter((u) => u.activo !== false)
                .map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} ({ROLE_LABELS[u.rol] || u.rol})</option>
                ))}
            </select>
          </div>
          <p className="text-emerald-200/75 text-[11px] text-center whitespace-nowrap overflow-hidden max-w-0 opacity-0 group-hover/sidebar:max-w-44 group-hover/sidebar:opacity-100 transition-all duration-300">
            v2.1 - Roles + Auditoria
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-[#F6F8F5]">
        <div className="w-full px-5 py-5 lg:px-7">
          <Page
            data={data}
            onUpdate={onUpdate}
            onNavigate={onNavigate}
            navTarget={navTarget}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        </div>
      </main>
    </div>
  );
}



