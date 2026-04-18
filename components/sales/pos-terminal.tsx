"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  CreditCard,
  LoaderCircle,
  MailCheck,
  Minus,
  PauseCircle,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserRoundPlus,
  UserRoundSearch,
  Wallet
} from "lucide-react";
import { toast } from "sonner";

import {
  lookupCustomerAction,
  processSaleAction,
  searchOrCreateCustomerAction
} from "@/app/sales/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

type PosProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: unknown;
  stock: number;
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string | null;
  phone: string | null;
};

type CartItem = PosProduct & {
  quantity: number;
};

type PaymentMethod = "qr" | "card" | "cash" | "split";

type CustomerFormState = {
  documentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const IVA_RATE = 0.19;

const shortcutPills = [
  { key: "F1", label: "Buscar" },
  { key: "F2", label: "Imprimir" },
  { key: "F3", label: "Facturar" },
  { key: "ESC", label: "Hold" }
] as const;

const paymentOptions: Array<{
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof QrCode;
}> = [
  { id: "qr", label: "QR dinamico", hint: "Nequi, Daviplata, billeteras", icon: QrCode },
  { id: "card", label: "Tarjeta", hint: "Datafono conectado por API", icon: CreditCard },
  { id: "cash", label: "Efectivo", hint: "Cambio y cierre de caja", icon: Wallet },
  { id: "split", label: "Pago mixto", hint: "Divide efectivo y transferencia", icon: BadgeDollarSign }
];

function mapCustomerToForm(customer: Customer | null): CustomerFormState {
  return {
    documentId: customer?.documentId ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? ""
  };
}

export function PosTerminal({
  products,
  customer
}: Readonly<{
  products: PosProduct[];
  customer: Customer | null;
}>) {
  const [term, setTerm] = useState("");
  const [productsState, setProductsState] = useState(products);
  const [customerSearch, setCustomerSearch] = useState(customer?.documentId ?? "");
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(customer);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("qr");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saleOnHold, setSaleOnHold] = useState(false);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [processingSale, setProcessingSale] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Listo para facturacion electronica, envio por correo y tirilla POS."
  );
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(mapCustomerToForm(customer));
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) {
      return productsState;
    }

    return productsState.filter((product) =>
      [product.name, product.sku, product.barcode].some((field) =>
        field.toLowerCase().includes(normalizedTerm)
      )
    );
  }, [productsState, term]);

  const activeCustomerName = useMemo(() => {
    if (!activeCustomer) {
      return "Consumidor final";
    }

    return `${activeCustomer.firstName} ${activeCustomer.lastName}`.trim();
  }, [activeCustomer]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );
  const taxableBase = subtotal;
  const ivaValue = subtotal * IVA_RATE;
  const total = subtotal + ivaValue;

  const suggestedReorder = useMemo(
    () => productsState.filter((product) => product.stock <= 3).slice(0, 3),
    [productsState]
  );

  const frequentProducts = useMemo(
    () => cart.slice(0, 3).map((product) => product.name),
    [cart]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setStatusMessage("Busqueda priorizada para cajero rapido.");
      }

      if (event.key === "F2") {
        event.preventDefault();
        toast.success("Tirilla POS lista para impresion.");
        setStatusMessage("Tirilla POS enviada a impresion termica.");
      }

      if (event.key === "F3") {
        event.preventDefault();
        if (!processingSale) {
          void handleProcessInvoice();
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSaleOnHold((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const operationalMessage = saleOnHold
    ? "Venta en hold. El cajero puede atender otro cliente."
    : statusMessage;

  function syncCustomer(customerRecord: Customer | null) {
    setActiveCustomer(customerRecord);
    setCustomerForm(mapCustomerToForm(customerRecord));
    setCustomerSearch(customerRecord?.documentId ?? "");
  }

  async function handleLookupCustomer(documentId = customerSearch) {
    const normalizedDocumentId = documentId.trim();
    if (normalizedDocumentId.length < 6) {
      return;
    }

    setLookingUpCustomer(true);

    try {
      const customerRecord = await lookupCustomerAction({
        documentId: normalizedDocumentId
      });

      if (!customerRecord) {
        setActiveCustomer(null);
        setCustomerForm((current) => ({
          ...current,
          documentId: normalizedDocumentId
        }));
        setStatusMessage("Cliente no encontrado. Completa el registro inline para continuar.");
        return;
      }

      syncCustomer(customerRecord);
      setStatusMessage("Cliente identificado. Se cargaron datos y compras frecuentes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo buscar el cliente.");
    } finally {
      setLookingUpCustomer(false);
    }
  }

  function addToCart(product: PosProduct) {
    const currentQuantity = cart.find((item) => item.id === product.id)?.quantity ?? 0;

    if (product.stock <= currentQuantity) {
      toast.error(`Stock insuficiente para ${product.name}.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
    setStatusMessage(`Producto agregado: ${product.name}.`);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => {
      const target = current.find((item) => item.id === productId);
      if (!target) {
        return current;
      }

      const product = productsState.find((item) => item.id === productId);
      const nextQuantity = target.quantity + delta;

      if (delta > 0 && product && nextQuantity > product.stock) {
        toast.error(`No hay mas unidades disponibles de ${product.name}.`);
        return current;
      }

      return current
        .map((item) => (item.id === productId ? { ...item, quantity: Math.max(nextQuantity, 0) } : item))
        .filter((item) => item.quantity > 0);
    });
  }

  async function handleSaveCustomer() {
    setSavingCustomer(true);

    try {
      const result = await searchOrCreateCustomerAction(customerForm);

      if (result.status === "requires_registration" || !result.customer) {
        throw new Error(
          "Completa nombre, apellido y correo para registrar el cliente antes de facturar."
        );
      }

      syncCustomer(result.customer);
      setDialogOpen(false);
      toast.success("Cliente listo para la facturacion.");
      setStatusMessage("Cliente creado inline. CRM listo para fidelizacion y factura.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cliente.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleProcessInvoice() {
    if (!cart.length) {
      toast.error("Agrega productos antes de facturar.");
      return;
    }

    setProcessingSale(true);

    try {
      let customerId = activeCustomer?.id ?? null;

      if (!customerId && customerForm.documentId.trim()) {
        const customerResult = await searchOrCreateCustomerAction(customerForm);

        if (customerResult.status === "requires_registration" || !customerResult.customer) {
          setDialogOpen(true);
          throw new Error(
            "El cliente no existe todavia. Completa el registro inline para continuar."
          );
        }

        syncCustomer(customerResult.customer);
        customerId = customerResult.customerId;
      }

      const result = await processSaleAction({
        customerId,
        subtotal,
        discount: 0,
        paymentMethod: selectedPayment,
        cashReceived: selectedPayment === "cash" ? total : undefined,
        notes: `Cobro POS desde pantalla senior. Metodo: ${selectedPayment}.`,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.price)
        }))
      });

      setProductsState((current) =>
        current.map((product) => {
          const soldItem = cart.find((item) => item.id === product.id);
          if (!soldItem) {
            return product;
          }

          return {
            ...product,
            stock: Math.max(product.stock - soldItem.quantity, 0)
          };
        })
      );
      setCart([]);
      toast.success(`Venta ${result.invoiceNumber} registrada correctamente.`);
      setStatusMessage(
        result.customerEmail
          ? `Factura ${result.invoiceNumber} emitida y correo en cola de envio.`
          : `Factura ${result.invoiceNumber} emitida. El cliente no tiene correo registrado.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo procesar la venta.");
    } finally {
      setProcessingSale(false);
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] border border-sky-400/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_24%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95))] p-3 shadow-[0_30px_90px_rgba(2,132,199,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />
        <div className="relative grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <Card className="border-sky-400/10 bg-slate-950/65 text-slate-50">
            <CardHeader className="border-b border-sky-300/10 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Search className="size-5 text-sky-300" />
                    POS rapido
                  </CardTitle>
                  <p className="text-sm text-slate-300">
                    Catalogo de alta velocidad con alertas de inventario y enfoque power user.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Omnicanal activo
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-4 size-4 text-slate-400" />
                  <Input
                    ref={searchInputRef}
                    className="h-14 rounded-2xl border-sky-300/10 bg-slate-900/80 pl-11 text-base text-slate-50 placeholder:text-slate-400"
                    placeholder="F1 | Busca por nombre, SKU o codigo de barras"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                  />
                </div>
                <div className="rounded-2xl border border-sky-300/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                  <p className="font-medium text-slate-100">Abastecimiento</p>
                  <p>{suggestedReorder.length} referencias en reorden sugerido</p>
                </div>
              </div>

              <div className="grid gap-3">
                {filteredProducts.slice(0, 8).map((product) => {
                  const isLowStock = product.stock <= 3;

                  return (
                    <button
                      key={product.id}
                      className="group flex items-center justify-between rounded-[1.5rem] border border-sky-300/10 bg-slate-900/70 px-4 py-4 text-left transition hover:border-sky-300/30 hover:bg-slate-900"
                      onClick={() => addToCart(product)}
                      type="button"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "size-2.5 rounded-full",
                              isLowStock
                                ? "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.7)]"
                                : "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.65)]"
                            )}
                          />
                          <p className="font-medium text-slate-50">{product.name}</p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {product.sku} | {product.barcode}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            isLowStock ? "text-rose-300" : "text-emerald-300"
                          )}
                        >
                          {isLowStock
                            ? `Stock critico: ${product.stock} unidades`
                            : `Stock saludable: ${product.stock} unidades`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-semibold text-slate-50">
                          {formatCurrency(String(product.price))}
                        </span>
                        <span className="text-xs text-sky-200 transition group-hover:text-sky-100">
                          Agregar a venta
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {suggestedReorder.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-amber-300/15 bg-amber-400/10 px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-amber-100">{product.name}</p>
                    <p className="text-amber-200/80">Orden sugerida por stock minimo</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-400/10 bg-slate-950/75 text-slate-50">
            <CardHeader className="border-b border-sky-300/10 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ShoppingCart className="size-5 text-sky-300" />
                    Venta actual · Modo Senior
                  </CardTitle>
                  <p className="text-sm text-slate-300">
                    Automatizacion contable, CRM y despacho de factura sin friccion.
                  </p>
                </div>
                <div className="rounded-full border border-sky-300/15 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
                  {saleOnHold ? "Venta en hold" : "DIAN ready"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="rounded-[1.6rem] border border-sky-300/10 bg-slate-900/80 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                    <UserRoundSearch className="size-4 text-sky-300" />
                    Seccion de cliente
                  </div>
                  <Button
                    className="rounded-xl border-sky-300/15 bg-sky-400/10 text-sky-50 hover:bg-sky-400/20"
                    onClick={() => setDialogOpen(true)}
                    type="button"
                    variant="secondary"
                  >
                    <UserRoundPlus className="size-4" />
                    Nuevo cliente
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      className="h-12 rounded-2xl border-sky-300/10 bg-slate-950/80 pr-10 text-slate-50 placeholder:text-slate-400"
                      placeholder="Documento, NIT o cedula"
                      value={customerSearch}
                      onBlur={() => void handleLookupCustomer()}
                      onChange={(event) => {
                        setCustomerSearch(event.target.value);
                        setCustomerForm((current) => ({
                          ...current,
                          documentId: event.target.value
                        }));
                        if (!event.target.value.trim()) {
                          setActiveCustomer(null);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleLookupCustomer();
                        }
                      }}
                    />
                    {lookingUpCustomer ? (
                      <LoaderCircle className="absolute right-3 top-3.5 size-5 animate-spin text-sky-300" />
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-sky-300/10 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-50">{activeCustomerName}</p>
                        <p className="text-sm text-slate-300">
                          {customerForm.documentId || "Sin documento"} |{" "}
                          {customerForm.email || "correo pendiente"} |{" "}
                          {customerForm.phone || "telefono pendiente"}
                        </p>
                      </div>
                      <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                        {activeCustomer ? "CRM activo" : "Registro pendiente"}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-900/90 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Productos frecuentes
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(frequentProducts.length ? frequentProducts : ["Sin historial reciente"]).map(
                            (productName) => (
                              <span
                                key={productName}
                                className="rounded-full border border-sky-300/10 bg-sky-400/10 px-3 py-1 text-xs text-sky-100"
                              >
                                {productName}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-900/90 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Automatizacion
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          Lookup de documento, perfilado CRM y envio automatico de XML/PDF.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-sky-300/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,47,73,0.78))] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
                  <ShieldCheck className="size-4 text-sky-300" />
                  Desglose contable
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Base gravable</span>
                    <span>{formatCurrency(taxableBase)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>IVA (19%)</span>
                    <span>{formatCurrency(ivaValue)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-sky-300/15 bg-sky-400/10 px-4 py-3 text-xl font-semibold text-slate-50">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                  <Sparkles className="size-4 text-sky-300" />
                  Metodos de pago
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon;
                    const active = selectedPayment === option.id;

                    return (
                      <button
                        key={option.id}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          active
                            ? "border-sky-300/40 bg-sky-400/15 text-slate-50"
                            : "border-sky-300/10 bg-slate-900/80 text-slate-300 hover:border-sky-300/25"
                        )}
                        onClick={() => setSelectedPayment(option.id)}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("size-5", active ? "text-sky-200" : "text-slate-400")} />
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="text-xs text-slate-400">{option.hint}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-[1.6rem] border border-sky-300/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-100">Items en venta</p>
                  <span className="text-xs text-slate-400">{cart.length} lineas activas</span>
                </div>

                {cart.length ? (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-sky-300/10 bg-slate-950/80 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-50">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            {item.quantity} x {formatCurrency(String(item.price))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-full border border-sky-300/15 p-2 text-slate-300 transition hover:bg-slate-900"
                            onClick={() => updateQuantity(item.id, -1)}
                            type="button"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            className="rounded-full border border-sky-300/15 p-2 text-slate-300 transition hover:bg-slate-900"
                            onClick={() => updateQuantity(item.id, 1)}
                            type="button"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-sky-300/15 px-4 py-6 text-sm text-slate-400">
                    Agrega productos desde la tarjeta izquierda para iniciar una venta.
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Button
                  className="h-14 rounded-2xl bg-sky-400 text-slate-950 hover:bg-sky-300"
                  disabled={processingSale}
                  onClick={() => startTransition(() => void handleProcessInvoice())}
                  type="button"
                >
                  {processingSale ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <MailCheck className="size-4" />
                  )}
                  Facturar y enviar por correo [F3]
                </Button>
                <Button
                  className="h-14 rounded-2xl border border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800"
                  onClick={() => {
                    toast.success("Tirilla POS lista para impresion.");
                    setStatusMessage("Tirilla generada con resumen fiscal e impuestos.");
                  }}
                  type="button"
                  variant="secondary"
                >
                  Imprimir tirilla [F2]
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {shortcutPills.map((shortcut) => (
                  <span
                    key={shortcut.key}
                    className="rounded-full border border-sky-300/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-300"
                  >
                    [{shortcut.key}] {shortcut.label}
                  </span>
                ))}
              </div>

              <div className="rounded-2xl border border-sky-300/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                <div className="flex items-center gap-2 font-medium text-slate-100">
                  <PauseCircle className="size-4 text-sky-300" />
                  Estado operacional
                </div>
                <p className="mt-2">{operationalMessage}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-sky-300/10 bg-slate-950 text-slate-50">
          <DialogHeader>
            <DialogTitle>Nuevo cliente inline</DialogTitle>
            <DialogDescription className="text-slate-400">
              Completa el perfil para CRM, DIAN y envio automatico de factura.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 pt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customer-document">
                NIT / Cedula
              </label>
              <Input
                id="customer-document"
                className="border-sky-300/10 bg-slate-900 text-slate-50"
                value={customerForm.documentId}
                onBlur={() => void handleLookupCustomer(customerForm.documentId)}
                onChange={(event) =>
                  setCustomerForm((current) => ({ ...current, documentId: event.target.value }))
                }
                placeholder="Escribe el documento para autocompletar"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="customer-first-name">
                  Nombre
                </label>
                <Input
                  id="customer-first-name"
                  className="border-sky-300/10 bg-slate-900 text-slate-50"
                  value={customerForm.firstName}
                  onChange={(event) =>
                    setCustomerForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="customer-last-name">
                  Apellido
                </label>
                <Input
                  id="customer-last-name"
                  className="border-sky-300/10 bg-slate-900 text-slate-50"
                  value={customerForm.lastName}
                  onChange={(event) =>
                    setCustomerForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="customer-email">
                  Correo
                </label>
                <Input
                  id="customer-email"
                  className="border-sky-300/10 bg-slate-900 text-slate-50"
                  value={customerForm.email}
                  onChange={(event) =>
                    setCustomerForm((current) => ({ ...current, email: event.target.value }))
                  }
                  type="email"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="customer-phone">
                  Telefono
                </label>
                <Input
                  id="customer-phone"
                  className="border-sky-300/10 bg-slate-900 text-slate-50"
                  value={customerForm.phone}
                  onChange={(event) =>
                    setCustomerForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-sky-300/10 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              Si el documento existe, el sistema recupera el cliente. Si no existe, lo registra
              antes de la venta.
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 rounded-2xl"
                disabled={savingCustomer}
                onClick={() => startTransition(() => void handleSaveCustomer())}
                type="button"
              >
                {savingCustomer ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Guardar cliente
              </Button>
              <Button
                className="rounded-2xl"
                onClick={() => setDialogOpen(false)}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
