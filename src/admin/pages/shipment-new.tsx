import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  getGetDashboardSummaryQueryKey,
  getListInvoicesQueryKey,
  getListShipmentsQueryKey,
  useCreateShipment,
  useListAddresses,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  FileText,
  Loader2,
  LocateFixed,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

// ─── Schema (unchanged) ───────────────────────────────────────────────────────

const formSchema = z.object({
  pickupAddress: z.string().min(5, "Pickup address is required"),
  destinationAddress: z.string().min(5, "Destination address is required"),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  packageType: z.enum(["document", "parcel", "fragile", "oversized"]),
  weightKg: z.coerce.number().positive("Weight must be positive"),
  dimensionsCm: z.string().optional(),
  deliverySpeed: z.enum(["standard", "express", "overnight"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
const MAX_WEIGHT_WARNING = 400;
const WEIGHT_SLIDER_MAX = 600;
const SHIPMENT_DRAFT_STORAGE_KEY = "xenith-shipment-draft";

function estimatePreviewPrice(weightKg: number, deliverySpeed: FormValues["deliverySpeed"]) {
  const base = 55 + weightKg * 8;
  const multiplier = deliverySpeed === "overnight" ? 1.65 : deliverySpeed === "express" ? 1.3 : 1;
  return Math.round(base * multiplier);
}

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Route & recipient", description: "Where to pick up and deliver" },
  { label: "Package & service", description: "What you're sending and speed" },
  { label: "Review & confirm", description: "Double-check before booking" },
];

function getShipmentDraftKey(userId?: number) {
  return userId ? `${SHIPMENT_DRAFT_STORAGE_KEY}-${userId}` : SHIPMENT_DRAFT_STORAGE_KEY;
}

function StepBar({
  current,
  completed,
  stepRefs,
  containerRef,
}: {
  current: number;
  completed: Set<number>;
  stepRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const activeStep = stepRefs.current[current];
    activeStep?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [current, stepRefs]);

  const progressPercentage = Math.round((completed.size / STEPS.length) * 100);

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Step {current + 1} of {STEPS.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{STEPS[current]?.description}</p>
        </div>
        <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {progressPercentage}%
        </span>
      </div>
      <div
        ref={containerRef}
        className="ui-scrollbar overflow-x-auto rounded-[1.75rem] border border-border/80 bg-card/80 px-4 py-5 shadow-sm"
      >
        <div className="flex min-w-[780px] items-start gap-2">
          {STEPS.map((step, i) => {
            const isDone = completed.has(i);
            const isActive = i === current;
            const leftActive = i > 0 && (completed.has(i - 1) || isActive);
            const rightActive = isDone;

            return (
              <div key={i} ref={(node) => { stepRefs.current[i] = node; }} className="flex flex-1 items-start">
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span
                    className={cn(
                      "mb-2 text-xs font-semibold tracking-wide",
                      isDone || isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                  <div className="flex w-full items-center">
                    <span
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i === 0 ? "opacity-0" : leftActive ? "bg-primary/75" : "bg-muted",
                      )}
                    />
                    <span
                      className={cn(
                        "mx-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                        isDone || isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background text-muted-foreground",
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i === STEPS.length - 1 ? (isDone ? "bg-primary/75" : "bg-muted") : rightActive ? "bg-primary/75" : "bg-muted",
                      )}
                    />
                  </div>
                  <span className="mt-2 text-[11px] text-muted-foreground">{step.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Guide banner ──────────────────────────────────────────────────────────────

function GuideBanner({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">{children}</p>
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/30 px-5 py-3.5">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
        {badge && (
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Address field with GPS button ────────────────────────────────────────────

function AddressField({
  label,
  field,
  placeholder,
  geoLabel,
  geoLoading,
  geoTag,
  onGeoRequest,
}: {
  label: string;
  field: any;
  placeholder: string;
  geoLabel: string;
  geoLoading: boolean;
  geoTag: string | null;
  onGeoRequest: () => void;
}) {
  return (
    <FormItem>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <FormLabel className="text-sm font-medium">{label}</FormLabel>
        <button
          type="button"
          onClick={onGeoRequest}
          disabled={geoLoading}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            "border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
            geoLoading && "cursor-not-allowed opacity-60",
          )}
        >
          {geoLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <LocateFixed className="h-3 w-3" />
          )}
          {geoLoading ? "Locating…" : "Use GPS"}
        </button>
      </div>
      <FormControl>
        <Input
          placeholder={placeholder}
          {...field}
          className="h-11 rounded-xl bg-secondary/40 text-sm"
        />
      </FormControl>
      {geoTag && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
          <MapPin className="h-3 w-3 shrink-0" />
          {geoTag}
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
}

// ─── Package type selector ────────────────────────────────────────────────────

const PKG_OPTIONS: { value: FormValues["packageType"]; label: string; sub: string; icon: React.ElementType }[] = [
  { value: "document", label: "Document",  sub: "Letters, contracts, papers",   icon: FileText },
  { value: "parcel",   label: "Parcel",    sub: "Standard boxed goods",          icon: Package },
  { value: "fragile",  label: "Fragile",   sub: "Requires careful handling",     icon: ShieldCheck },
  { value: "oversized",label: "Oversized", sub: "Large or heavy items",          icon: Truck },
];

function PackageSelector({
  value,
  onChange,
}: {
  value: FormValues["packageType"];
  onChange: (v: FormValues["packageType"]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PKG_OPTIONS.map(({ value: v, label, sub, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all",
            value === v
              ? "border-primary/40 bg-primary/8 ring-1 ring-primary/30"
              : "border-border bg-secondary/30 hover:border-primary/20 hover:bg-secondary/60",
          )}
        >
          <Icon
            className={cn("h-5 w-5", value === v ? "text-primary" : "text-muted-foreground")}
          />
          <div>
            <p className={cn("text-sm font-semibold", value === v ? "text-primary" : "text-foreground")}>
              {label}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Speed selector ───────────────────────────────────────────────────────────

const SPEED_OPTIONS: {
  value: FormValues["deliverySpeed"];
  label: string;
  time: string;
  mult: string;
  note: string;
}[] = [
  { value: "standard", label: "Standard",  time: "3 – 5 business days", mult: "Base rate",  note: "×1.0" },
  { value: "express",  label: "Express",   time: "1 – 2 business days", mult: "×1.3 rate",  note: "×1.3" },
  { value: "overnight",label: "Overnight", time: "Next business day",   mult: "×1.65 rate", note: "×1.65" },
];

function SpeedSelector({
  value,
  onChange,
}: {
  value: FormValues["deliverySpeed"];
  onChange: (v: FormValues["deliverySpeed"]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {SPEED_OPTIONS.map(({ value: v, label, time, mult }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-col gap-1 rounded-xl border p-4 text-left transition-all",
            value === v
              ? "border-primary/40 bg-primary/8 ring-1 ring-primary/30"
              : "border-border bg-secondary/30 hover:border-primary/20 hover:bg-secondary/60",
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-semibold", value === v ? "text-primary" : "text-foreground")}>
              {label}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                value === v
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {mult}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{time}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Price summary card ───────────────────────────────────────────────────────

function PriceCard({
  price,
  weightKg,
  deliverySpeed,
}: {
  price: number;
  weightKg: number;
  deliverySpeed: FormValues["deliverySpeed"];
}) {
  return (
    <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-sky-50 p-5 dark:border-blue-900/60 dark:from-blue-950/40 dark:to-sky-950/40">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-500 dark:text-blue-400">
        Estimated invoice total
      </p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
        ${price.toFixed(2)}
      </p>
      <p className="mt-1.5 text-xs text-blue-700/70 dark:text-blue-300/70">
        Based on {Number(weightKg || 1).toFixed(1)} kg · {deliverySpeed} speed. Adjust above to recalculate.
      </p>
    </div>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium leading-snug">{value || "—"}</span>
    </div>
  );
}

// ─── Saved address quick-fill ─────────────────────────────────────────────────

function SavedAddressFill({
  addresses,
  onApply,
}: {
  addresses: any[];
  onApply: (type: "pickupAddress" | "destinationAddress", value: string) => void;
}) {
  if (!addresses.length) return null;
  return (
    <div className="mb-5 rounded-xl border border-border bg-muted/20 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Quick fill from saved addresses
      </p>
      <div className="flex flex-wrap gap-2">
        {addresses.slice(0, 3).map((addr) => {
          const formatted = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`;
          return (
            <div key={addr.id} className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onApply("pickupAddress", formatted)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                ↑ Pickup: {addr.label}
              </button>
              <button
                type="button"
                onClick={() => onApply("destinationAddress", formatted)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                ↓ Deliver: {addr.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShipmentNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: addresses = [] } = useListAddresses({ customerId: user?.id });
  const topRef = useRef<HTMLDivElement | null>(null);
  const stepStripRef = useRef<HTMLDivElement | null>(null);
  const stepItemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [pickupGeoTag, setPickupGeoTag]   = useState<string | null>(null);
  const [destGeoTag, setDestGeoTag]       = useState<string | null>(null);
  const [geoLoadingField, setGeoLoadingField] = useState<"pickupAddress" | "destinationAddress" | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupAddress:      "",
      destinationAddress: "",
      recipientName:      "",
      recipientPhone:     "",
      packageType:        "parcel",
      weightKg:           1,
      dimensionsCm:       "",
      deliverySpeed:      "express",
      notes:              "",
    },
  });

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const raw = window.localStorage.getItem(getShipmentDraftKey(user.id));
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as {
        values?: Partial<FormValues>;
        step?: number;
        completedSteps?: number[];
        pickupGeoTag?: string | null;
        destGeoTag?: string | null;
      };

      if (draft.values) {
        form.reset({
          pickupAddress: draft.values.pickupAddress ?? "",
          destinationAddress: draft.values.destinationAddress ?? "",
          recipientName: draft.values.recipientName ?? "",
          recipientPhone: draft.values.recipientPhone ?? "",
          packageType: draft.values.packageType ?? "parcel",
          weightKg: draft.values.weightKg ?? 1,
          dimensionsCm: draft.values.dimensionsCm ?? "",
          deliverySpeed: draft.values.deliverySpeed ?? "express",
          notes: draft.values.notes ?? "",
        });
      }

      if (typeof draft.step === "number") {
        setStep(Math.min(Math.max(draft.step, 0), STEPS.length - 1));
      }

      if (Array.isArray(draft.completedSteps)) {
        setCompletedSteps(new Set(draft.completedSteps.filter((value) => value >= 0 && value < STEPS.length)));
      }

      setPickupGeoTag(draft.pickupGeoTag ?? null);
      setDestGeoTag(draft.destGeoTag ?? null);
    } catch {
      window.localStorage.removeItem(getShipmentDraftKey(user.id));
    }
  }, [form, user]);

  const deliverySpeed      = form.watch("deliverySpeed");
  const weightKg           = form.watch("weightKg");
  const pickupAddress      = form.watch("pickupAddress");
  const destinationAddress = form.watch("destinationAddress");
  const packageType        = form.watch("packageType");
  const notes              = form.watch("notes");
  const recipientName      = form.watch("recipientName");
  const recipientPhone     = form.watch("recipientPhone");
  const dimensionsCm       = form.watch("dimensionsCm");
  const isWeightAboveLimit = Number(weightKg) > MAX_WEIGHT_WARNING;

  const estimatedPrice = useMemo(
    () => estimatePreviewPrice(Number(weightKg) || 1, deliverySpeed),
    [deliverySpeed, weightKg],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const payload = JSON.stringify({
      values: form.getValues(),
      step,
      completedSteps: Array.from(completedSteps),
      pickupGeoTag,
      destGeoTag,
    });
    window.localStorage.setItem(getShipmentDraftKey(user.id), payload);
  }, [completedSteps, destGeoTag, form, pickupGeoTag, step, user, pickupAddress, destinationAddress, recipientName, recipientPhone, packageType, weightKg, dimensionsCm, deliverySpeed, notes]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const createMutation = useCreateShipment({
    mutation: {
      onSuccess: ({ shipment, invoice }) => {
        if (typeof window !== "undefined" && user) {
          window.localStorage.removeItem(getShipmentDraftKey(user.id));
        }
        toast({
          title: "Shipment created",
          description: `Tracking ID ${shipment.trackingNumber} is ready. Redirecting to payment…`,
        });
        queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation(`/invoices/${invoice.id}?tracking=${shipment.trackingNumber}`);
      },
      onError: () => {
        toast({
          title: "Failed to create shipment",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!user) return;
    createMutation.mutate({ data: { ...data, customerId: user.id } });
  };

  const applyAddress = useCallback(
    (type: "pickupAddress" | "destinationAddress", value: string) => {
      form.setValue(type, value, { shouldValidate: true, shouldDirty: true });
    },
    [form],
  );

  const requestGPS = useCallback(
    (type: "pickupAddress" | "destinationAddress") => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        toast({ title: "Location unavailable", description: "Your browser does not support geolocation.", variant: "destructive" });
        return;
      }
      setGeoLoadingField(type);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat   = Number(pos.coords.latitude.toFixed(4));
          const lng   = Number(pos.coords.longitude.toFixed(4));
          const label = `GPS location (${lat}, ${lng})`;
          applyAddress(type, label);
          if (type === "pickupAddress") setPickupGeoTag("Location captured via GPS");
          else setDestGeoTag("Location captured via GPS");
          setGeoLoadingField(null);
          toast({
            title: "Location added",
            description: `${type === "pickupAddress" ? "Pickup" : "Destination"} updated from your GPS position.`,
          });
        },
        () => {
          setGeoLoadingField(null);
          toast({ title: "Permission required", description: "Allow location access to auto-fill this address.", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    },
    [applyAddress, toast],
  );

  // ── Step navigation ──────────────────────────────────────────────────────

  const advanceFromStep0 = async () => {
    const ok = await form.trigger(["pickupAddress", "destinationAddress"]);
    if (!ok) return;
    setCompletedSteps((prev) => new Set(prev).add(0));
    setStep(1);
  };

  const advanceFromStep1 = async () => {
    const ok = await form.trigger(["packageType", "weightKg", "deliverySpeed"]);
    if (!ok) return;
    setCompletedSteps((prev) => new Set(prev).add(1));
    setStep(2);
  };

  const goBack = (to: number) => {
    setStep(to);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl space-y-0 pb-10">
      <div ref={topRef} />
      {/* Page header */}
   <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-sky-100 bg-white px-6 py-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)] sm:px-6">

  <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="desk-grid" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#e8f3fc" strokeWidth="0.7" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#desk-grid)" />

    {/* 3-step route nodes */}
    <g opacity="0.06" transform="translate(310,10)">
      <circle cx="0" cy="30" r="6" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <circle cx="0" cy="30" r="2.5" fill="#1a6fbe" />
      <line x1="6" y1="30" x2="44" y2="30" stroke="#1a6fbe" strokeWidth="1.4" strokeDasharray="4 3" />
      <circle cx="50" cy="30" r="6" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <circle cx="50" cy="30" r="2.5" fill="#1a6fbe" />
      <line x1="56" y1="30" x2="94" y2="30" stroke="#1a6fbe" strokeWidth="1.4" strokeDasharray="4 3" />
      <circle cx="100" cy="30" r="6" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <circle cx="100" cy="30" r="2.5" fill="#1a6fbe" />
      <line x1="0" y1="36" x2="0" y2="44" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="50" y1="36" x2="50" y2="44" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="100" y1="36" x2="100" y2="44" stroke="#1a6fbe" strokeWidth="1.2" />
      <rect x="-14" y="44" width="28" height="14" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.3" />
      <rect x="36" y="44" width="28" height="14" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.3" />
      <rect x="86" y="44" width="28" height="14" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.3" />
    </g>

    {/* Package + dispatch arrow */}
    <g opacity="0.055" transform="translate(470,14)">
      <rect x="0" y="8" width="36" height="32" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <line x1="0" y1="20" x2="36" y2="20" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="12" y1="8" x2="12" y2="20" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="24" y1="8" x2="24" y2="20" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="44" y1="24" x2="60" y2="24" stroke="#1a6fbe" strokeWidth="1.8" />
      <polyline points="54,18 62,24 54,30" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
    </g>

    {/* Invoice / form */}
    <g opacity="0.055" transform="translate(560,60)">
      <rect x="0" y="0" width="36" height="46" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <line x1="6" y1="10" x2="30" y2="10" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="6" y1="17" x2="26" y2="17" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="6" y1="24" x2="28" y2="24" stroke="#1a6fbe" strokeWidth="1.2" />
      <rect x="6" y="31" width="10" height="8" rx="1.5" fill="none" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="20" y1="35" x2="30" y2="35" stroke="#1a6fbe" strokeWidth="1.2" />
      <path d="M22 -6 L22 0 L14 0 L14 -6 Z" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
      <line x1="18" y1="-6" x2="18" y2="-10" stroke="#1a6fbe" strokeWidth="1.5" />
    </g>

    {/* Tracking ID tag */}
    <g opacity="0.055" transform="translate(420,68)">
      <rect x="0" y="0" width="44" height="22" rx="11" fill="none" stroke="#1a6fbe" strokeWidth="1.6" />
      <line x1="8" y1="11" x2="18" y2="11" stroke="#1a6fbe" strokeWidth="1.4" />
      <line x1="22" y1="11" x2="28" y2="11" stroke="#1a6fbe" strokeWidth="1.4" />
      <line x1="32" y1="11" x2="36" y2="11" stroke="#1a6fbe" strokeWidth="1.4" />
      <circle cx="-7" cy="11" r="4" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
      <line x1="-3" y1="11" x2="0" y2="11" stroke="#1a6fbe" strokeWidth="1.4" />
    </g>

    {/* Soft glow circles */}
    <circle cx="95%" cy="10%" r="72" fill="rgba(56,189,248,0.07)" />
    <circle cx="97%" cy="92%" r="52" fill="rgba(56,189,248,0.05)" />
    <circle cx="-1%" cy="55%" r="44" fill="rgba(56,189,248,0.04)" />
  </svg>

  <div className="relative">
    <div className="flex items-center gap-3">
      <Link href="/shipments" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3 w-3" />
      </Link>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        New shipment
      </p>
    </div>
    <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">Book a delivery</h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Fill in three quick steps — we generate your tracking ID instantly on submission and open the invoice for Paystack payment.
    </p>
  </div>
</div>

      {/* Step indicator */}
      <StepBar current={step} completed={completedSteps} stepRefs={stepItemRefs} containerRef={stepStripRef} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* ── STEP 0: Route & recipient ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <GuideBanner icon={MapPin}>
                <strong>Start with your route.</strong> Enter where the package will be collected from and where it needs to go. Tap <em>Use GPS</em> next to either field to auto-fill your current coordinates. You can also use a saved address with the quick-fill buttons below.
              </GuideBanner>

              <Section icon={MapPin} title="Route">
                <SavedAddressFill addresses={addresses} onApply={applyAddress} />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <AddressField
                        label="Pickup address *"
                        field={field}
                        placeholder="14 Broad St, Lagos Island, Lagos"
                        geoLabel="Use GPS"
                        geoLoading={geoLoadingField === "pickupAddress"}
                        geoTag={pickupGeoTag}
                        onGeoRequest={() => requestGPS("pickupAddress")}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinationAddress"
                    render={({ field }) => (
                      <AddressField
                        label="Destination address *"
                        field={field}
                        placeholder="5 Admiralty Way, Lekki Phase 1, Lagos"
                        geoLabel="Use GPS"
                        geoLoading={geoLoadingField === "destinationAddress"}
                        geoTag={destGeoTag}
                        onGeoRequest={() => requestGPS("destinationAddress")}
                      />
                    )}
                  />
                </div>
              </Section>

              <Section icon={Package} title="Recipient" badge="optional">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} className="h-11 rounded-xl bg-secondary/40" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+234 800 000 0000" {...field} className="h-11 rounded-xl bg-secondary/40" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={advanceFromStep0}
                  className="h-11 gap-2 rounded-xl px-6"
                >
                  Continue to package details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Package & service ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <GuideBanner icon={Package}>
                <strong>Describe what you're sending and how fast it needs to arrive.</strong> The estimated price updates live as you change weight or delivery speed. This is a preview only — the final invoice is generated after you confirm on the next step.
              </GuideBanner>

              <Section icon={Package} title="Package type">
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <PackageSelector
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section icon={Truck} title="Weight & dimensions">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="weightKg"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Weight (kg) *</FormLabel>
                        <div className={cn("rounded-2xl border bg-secondary/30 p-4", isWeightAboveLimit ? "border-destructive/50" : "border-border")}>
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max={WEIGHT_SLIDER_MAX}
                                {...field}
                                onChange={(event) => field.onChange(event.target.value)}
                                className={cn("h-12 rounded-2xl bg-background lg:max-w-[220px]", isWeightAboveLimit && "border-destructive/50 text-destructive")}
                              />
                            </FormControl>
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>0 kg</span>
                                <span className={cn("rounded-full px-2.5 py-1 font-semibold", isWeightAboveLimit ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                                  {Number(weightKg || 0).toFixed(1)} kg
                                </span>
                                <span>{WEIGHT_SLIDER_MAX} kg</span>
                              </div>
                              <Slider
                                value={[Math.min(Number(weightKg) || 0.1, WEIGHT_SLIDER_MAX)]}
                                min={0.1}
                                max={WEIGHT_SLIDER_MAX}
                                step={0.1}
                                onValueChange={([value]) => field.onChange(Number(value.toFixed(1)))}
                                className={cn(isWeightAboveLimit && "[&_[data-slot='slider-range']]:bg-destructive")}
                              />
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <span className="text-muted-foreground">Drag the slider to tune the shipment weight quickly.</span>
                                <span className={cn("font-semibold", isWeightAboveLimit ? "text-destructive" : "text-emerald-600")}>
                                  {isWeightAboveLimit ? "Manual review weight" : "Within standard range"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {isWeightAboveLimit && (
                          <p className="mt-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            Weight above 400kg detected. This shipment may require special handling, route approval, or custom pricing review.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimensionsCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions (cm)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 30 × 20 × 15"
                            {...field}
                            className="h-11 rounded-xl bg-secondary/40"
                          />
                        </FormControl>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Optional — useful for fragile or oversized items
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section icon={Truck} title="Delivery speed">
                <FormField
                  control={form.control}
                  name="deliverySpeed"
                  render={({ field }) => (
                    <FormItem>
                      <SpeedSelector
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section icon={FileText} title="Special instructions" badge="optional">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Gate code, fragile orientation, leave at reception, call on arrival…"
                          className="min-h-[90px] rounded-xl bg-secondary/40"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <PriceCard
                price={estimatedPrice}
                weightKg={weightKg}
                deliverySpeed={deliverySpeed}
              />

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goBack(0)}
                  className="h-11 gap-2 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={advanceFromStep1}
                  className="h-11 flex-1 gap-2 rounded-xl"
                >
                  Review my booking
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Review & confirm ──────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <GuideBanner icon={BadgeCheck}>
                <strong>Almost done — review everything before submitting.</strong> Once confirmed, a tracking ID is generated instantly and an invoice is opened for payment via Paystack. Go back to edit anything before you confirm.
              </GuideBanner>

              <Section icon={MapPin} title="Route">
                <ReviewRow label="Pickup"      value={pickupAddress} />
                <ReviewRow label="Destination" value={destinationAddress} />
                <ReviewRow
                  label="Recipient"
                  value={[recipientName, recipientPhone].filter(Boolean).join(" · ") || "Not specified"}
                />
              </Section>

              <Section icon={Package} title="Package & service">
                <ReviewRow label="Package type"    value={packageType.charAt(0).toUpperCase() + packageType.slice(1)} />
                <ReviewRow label="Weight"          value={`${Number(weightKg || 0).toFixed(1)} kg`} />
                <ReviewRow label="Dimensions"      value={dimensionsCm || "Not provided"} />
                <ReviewRow label="Delivery speed"  value={deliverySpeed.charAt(0).toUpperCase() + deliverySpeed.slice(1)} />
                <ReviewRow label="Notes"           value={notes || "None"} />
              </Section>

              <PriceCard
                price={estimatedPrice}
                weightKg={weightKg}
                deliverySpeed={deliverySpeed}
              />

              {/* What happens next */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">What happens after you confirm</p>
                <ul className="space-y-3">
                  {[
                    { icon: BadgeCheck,  text: "A unique tracking ID is generated immediately" },
                    { icon: CreditCard,  text: "Your invoice opens — complete payment via Paystack test flow" },
                    { icon: ShieldCheck, text: "The receipt is attached to your invoice record once paid" },
                  ].map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goBack(1)}
                  className="h-11 gap-2 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-11 flex-1 gap-2 rounded-xl"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating shipment…
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="h-4 w-4" />
                      Confirm &amp; create shipment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </form>
      </Form>
    </div>
  );
}
