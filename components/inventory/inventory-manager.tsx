"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Minus,
  PackageCheck,
  Plus,
  ScanLine,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteProductAction,
  findProductByBarcodeAction,
  registerInventoryEntryAction
} from "@/app/inventory/actions";
import { ProductForm } from "@/components/forms/product-form";
import { InventoryTable, type InventoryTableProduct } from "@/components/inventory/inventory-table";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type SubcategoryOption = {
  id: string;
  name: string;
  categoryName: string;
};

type InventoryProduct = InventoryTableProduct;

type EntryItem = {
  productId: string;
  quantity: number;
  product: InventoryProduct;
};

export function InventoryManager({
  initialProducts,
  subcategories
}: Readonly<{
  initialProducts: InventoryProduct[];
  subcategories: SubcategoryOption[];
}>) {
  const [products, setProducts] = useState(initialProducts);
  const [scanValue, setScanValue] = useState("");
  const [entryItems, setEntryItems] = useState<EntryItem[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<InventoryProduct | null>(null);
  const [missingBarcode, setMissingBarcode] = useState("");
  const [isRegistering, startRegisterTransition] = useTransition();
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const shouldKeepScannerFocused = !isCreateOpen && !editingProduct && !deletingProduct && !missingBarcode;

  useEffect(() => {
    if (shouldKeepScannerFocused) {
      scanInputRef.current?.focus();
    }
  }, [shouldKeepScannerFocused]);

  const totalIncomingUnits = useMemo(
    () => entryItems.reduce((total, item) => total + item.quantity, 0),
    [entryItems]
  );

  async function handleScanSubmit(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const barcode = scanValue.trim();

    if (!barcode) {
      return;
    }

    try {
      const product = (await findProductByBarcodeAction({ barcode })) as InventoryProduct | null;

      if (!product) {
        setMissingBarcode(barcode);
        setScanValue("");
        return;
      }

      setEntryItems((current) => {
        const existing = current.find((item) => item.productId === product.id);
        if (existing) {
          return current.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        return [...current, { productId: product.id, quantity: 1, product }];
      });

      setProducts((current) => mergeProductIntoList(current, product));
      setScanValue("");
      toast.success(`${product.name} agregado al ingreso temporal.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible consultar el barcode.");
    }
  }

  function handleProductSaved(savedProduct: unknown) {
    const product = savedProduct as InventoryProduct;
    setProducts((current) => mergeProductIntoList(current, product));
    setEditingProduct(null);
    setIsCreateOpen(false);
  }

  function handleRegisterEntry() {
    startRegisterTransition(async () => {
      try {
        const updatedProducts = (await registerInventoryEntryAction({
          items: entryItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        })) as InventoryProduct[];

        setProducts((current) =>
          updatedProducts.reduce((accumulator, product) => mergeProductIntoList(accumulator, product), current)
        );
        setEntryItems([]);
        toast.success("Ingreso de mercancia registrado correctamente.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No fue posible registrar el ingreso.");
      }
    });
  }

  async function handleDeleteProduct() {
    if (!deletingProduct) {
      return;
    }

    try {
      await deleteProductAction({ id: deletingProduct.id });
      setProducts((current) => current.filter((product) => product.id !== deletingProduct.id));
      setEntryItems((current) => current.filter((item) => item.productId !== deletingProduct.id));
      toast.success("Producto eliminado correctamente.");
      setDeletingProduct(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar el producto.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Escaneo inteligente</p>
              <h2 className="text-xl font-semibold">Ingreso rapido de mercancia</h2>
            </div>
            <Button className="transition-transform hover:-translate-y-0.5" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              Crear producto
            </Button>
          </div>

          <div className="relative">
            <ScanLine className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
            <Input
              ref={scanInputRef}
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              onKeyDown={handleScanSubmit}
              onBlur={() => {
                if (shouldKeepScannerFocused) {
                  window.setTimeout(() => scanInputRef.current?.focus(), 0);
                }
              }}
              className="h-14 rounded-2xl border-primary/20 bg-primary/5 pl-12 text-base shadow-inner"
              placeholder="Escanee o ingrese codigo de barras..."
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MetricCard label="Items en cola" value={String(entryItems.length)} icon={<Box className="size-4" />} />
            <MetricCard
              label="Unidades por ingresar"
              value={String(totalIncomingUnits)}
              icon={<PackageCheck className="size-4" />}
            />
            <MetricCard
              label="Valor referencial"
              value={formatCurrency(
                entryItems.reduce((total, item) => total + item.quantity * Number(item.product.cost), 0)
              )}
              icon={<ArrowRight className="size-4" />}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ingreso temporal</h3>
              <p className="text-sm text-muted-foreground">
                Cada escaneo suma unidades antes de confirmar el ingreso.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!entryItems.length}
              onClick={() => setEntryItems([])}
            >
              Limpiar
            </Button>
          </div>

          <div className="space-y-3">
            {entryItems.length ? (
              entryItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3"
                >
                  <ProductAvatar name={item.product.name} imageUrl={item.product.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.product.barcode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setEntryItems((current) =>
                          current
                            .map((currentItem) =>
                              currentItem.productId === item.productId
                                ? { ...currentItem, quantity: currentItem.quantity - 1 }
                                : currentItem
                            )
                            .filter((currentItem) => currentItem.quantity > 0)
                        )
                      }
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setEntryItems((current) =>
                          current.map((currentItem) =>
                            currentItem.productId === item.productId
                              ? { ...currentItem, quantity: currentItem.quantity + 1 }
                              : currentItem
                          )
                        )
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive"
                      onClick={() =>
                        setEntryItems((current) =>
                          current.filter((currentItem) => currentItem.productId !== item.productId)
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                <p className="font-medium">Aun no hay productos en ingreso.</p>
                <p className="text-sm text-muted-foreground">
                  Escanea un barcode para construir la entrada de mercancia.
                </p>
              </div>
            )}
          </div>

          <Button
            className="mt-4 w-full transition-transform hover:-translate-y-0.5"
            disabled={!entryItems.length || isRegistering}
            onClick={handleRegisterEntry}
          >
            Registrar ingreso
          </Button>
        </div>
      </section>

      <InventoryTable
        products={products}
        onEdit={(product) => setEditingProduct(product)}
        onDelete={(product) => setDeletingProduct(product)}
      />

      <AppDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Crear producto"
        description="Registra el repuesto con foto, barcode y parametros comerciales."
      >
        <ProductForm
          key={`create-${missingBarcode || "default"}`}
          subcategories={subcategories}
          initialValues={missingBarcode ? { barcode: missingBarcode } : undefined}
          submitLabel="Guardar producto"
          onSaved={(savedProduct) => {
            handleProductSaved(savedProduct);
            setMissingBarcode("");
          }}
        />
      </AppDialog>

      <AppDialog
        open={Boolean(editingProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
          }
        }}
        title="Editar producto"
        description="Actualiza informacion, fotografia y precio desde una vista pre-cargada."
      >
        {editingProduct ? (
          <ProductForm
            product={toEditableProduct(editingProduct)}
            subcategories={subcategories}
            submitLabel="Guardar cambios"
            onSaved={handleProductSaved}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProduct(null);
          }
        }}
        title="Eliminar producto"
        description={
          deletingProduct
            ? `Esta accion eliminara ${deletingProduct.name} del inventario si no tiene ventas asociadas.`
            : undefined
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              {deletingProduct
                ? `Esta seguro de que desea eliminar el producto "${deletingProduct.name}"? Esta accion no se puede deshacer.`
                : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Eliminar
            </Button>
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={Boolean(missingBarcode)}
        onOpenChange={(open) => {
          if (!open) {
            setMissingBarcode("");
          }
        }}
        title="Producto no registrado"
        description="El barcode escaneado no coincide con ningun producto del catalogo."
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
              <p className="text-sm text-foreground">
                Producto no registrado. Por favor, cree el producto antes de ingresar mercancia.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setMissingBarcode("")}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setMissingBarcode("");
                setIsCreateOpen(true);
              }}
            >
              Crear producto
            </Button>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon
}: Readonly<{
  label: string;
  value: string;
  icon: ReactNode;
}>) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-sm">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function mergeProductIntoList(products: InventoryProduct[], product: InventoryProduct) {
  const nextProducts = products.some((current) => current.id === product.id)
    ? products.map((current) => (current.id === product.id ? product : current))
    : [product, ...products];

  return [...nextProducts].sort(
    (left, right) => new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime()
  );
}

function ProductAvatar({
  name,
  imageUrl
}: Readonly<{
  name: string;
  imageUrl?: string | null;
}>) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className="size-12 rounded-full object-cover shadow-sm" />;
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function toEditableProduct(product: InventoryProduct) {
  return {
    ...product,
    cost: Number(product.cost),
    price: Number(product.price),
    brand: product.brand ?? "",
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? ""
  };
}
