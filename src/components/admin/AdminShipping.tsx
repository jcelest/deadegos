"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShippingRate,
  ShippingSettings,
  slugifyRateId,
} from "@/lib/shipping";

function emptyRate(existingIds: string[]): ShippingRate {
  return {
    id: slugifyRateId("New Rate", existingIds),
    name: "New Rate",
    description: "",
    price: 0,
    estimatedDays: "5–7 business days",
    enabled: true,
  };
}

export default function AdminShipping() {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/shipping");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to load shipping settings");
      setLoading(false);
      return;
    }

    setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateRate = (index: number, patch: Partial<ShippingRate>) => {
    setSettings((current) => {
      if (!current) return current;

      const rates = [...current.rates];
      rates[index] = { ...rates[index], ...patch };

      let defaultMethodId = current.defaultMethodId;
      const updated = rates[index];
      if (patch.enabled === false && updated.id === current.defaultMethodId) {
        defaultMethodId =
          rates.find((rate) => rate.enabled)?.id || rates[0]?.id || "";
      }

      return { ...current, rates, defaultMethodId };
    });
  };

  const addRate = () => {
    setSettings((current) => {
      if (!current) return current;

      const ids = current.rates.map((rate) => rate.id);
      return {
        ...current,
        rates: [...current.rates, emptyRate(ids)],
      };
    });
  };

  const removeRate = (index: number) => {
    setSettings((current) => {
      if (!current) return current;

      const removed = current.rates[index];
      const rates = current.rates.filter((_, i) => i !== index);
      const defaultMethodId =
        removed.id === current.defaultMethodId
          ? rates.find((rate) => rate.enabled)?.id || rates[0]?.id || ""
          : current.defaultMethodId;

      return { ...current, rates, defaultMethodId };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Failed to save shipping settings");
      setSaving(false);
      return;
    }

    setSettings(data);
    setSuccess("Shipping settings saved.");
    setSaving(false);
    setTimeout(() => setSuccess(""), 2500);
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-white/40">Loading shipping settings...</p>;
  }

  if (!settings) {
    return <p className="py-12 text-center text-sm text-red-400">{error || "Unable to load shipping settings."}</p>;
  }

  const enabledRates = settings.rates.filter((rate) => rate.enabled);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="slogan-text text-sm text-white/60">SHIPPING SETTINGS</h2>
        <p className="mt-2 text-sm text-white/45">
          Control checkout shipping methods, prices, and free-shipping threshold.
        </p>
      </div>

      <section className="space-y-4 border border-white/10 bg-black/40 p-5">
        <h3 className="text-xs tracking-widest text-white/60">FREE SHIPPING</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs text-white/45">Order subtotal threshold ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.freeShippingThreshold}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  freeShippingThreshold: Number(event.target.value),
                })
              }
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-de-primary)] focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs text-white/45">Default checkout method</span>
            <select
              value={settings.defaultMethodId}
              onChange={(event) =>
                setSettings({ ...settings, defaultMethodId: event.target.value })
              }
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-de-primary)] focus:outline-none"
            >
              {enabledRates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-white/40">
          Orders at or above the threshold ship free regardless of selected method.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs tracking-widest text-white/60">SHIPPING METHODS</h3>
          <button
            type="button"
            onClick={addRate}
            className="border border-white/20 px-4 py-2 text-xs tracking-widest text-white/70 transition-colors hover:text-white"
          >
            + ADD METHOD
          </button>
        </div>

        <div className="space-y-4">
          {settings.rates.map((rate, index) => (
            <div key={`${rate.id}-${index}`} className="space-y-4 border border-white/10 bg-black/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white">{rate.name || "Untitled rate"}</p>
                  <p className="text-xs text-white/40">ID: {rate.id}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <input
                      type="checkbox"
                      checked={rate.enabled}
                      onChange={(event) => updateRate(index, { enabled: event.target.checked })}
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRate(index)}
                    className="text-xs tracking-widest text-red-400/80 transition-colors hover:text-red-400"
                  >
                    REMOVE
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs text-white/45">Name</span>
                  <input
                    value={rate.name}
                    onChange={(event) => updateRate(index, { name: event.target.value })}
                    className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-de-primary)] focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-white/45">Price ($)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rate.price}
                    onChange={(event) => updateRate(index, { price: Number(event.target.value) })}
                    className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-de-primary)] focus:outline-none"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs text-white/45">Description</span>
                  <input
                    value={rate.description}
                    onChange={(event) => updateRate(index, { description: event.target.value })}
                    className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-de-primary)] focus:outline-none"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs text-white/45">Estimated delivery</span>
                  <input
                    value={rate.estimatedDays}
                    onChange={(event) => updateRate(index, { estimatedDays: event.target.value })}
                    className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-de-primary)] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-[var(--color-de-primary)]">{success}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="glow-border border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-6 py-3 text-xs tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25 disabled:opacity-50"
      >
        {saving ? "SAVING..." : "SAVE SHIPPING SETTINGS"}
      </button>
    </div>
  );
}
