"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { MapPinpoint01Icon, GpsSignal01Icon } from "hugeicons-react";
import type { LatLng } from "./DeliveryMapPicker";
import { useTranslations } from "next-intl";

const DeliveryMapPicker = dynamic(() => import("./DeliveryMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full rounded-xl border border-white/10 bg-black/30 animate-pulse" />
  ),
});

/** Falls back here until the guest picks a point — central Cairo, since that's where Voya operates. */
const DEFAULT_CENTER: LatLng = { lat: 30.0444, lng: 31.2357 };

export default function DeliveryLocationPicker({
  address,
  onAddressChange,
  error,
}: {
  address: string;
  onAddressChange: (address: string) => void;
  error?: string;
}) {
  const t = useTranslations("delivery");
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const reverseGeocode = useCallback(
    async (loc: LatLng) => {
      setGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.lat}&lon=${loc.lng}`,
        );
        if (!res.ok) throw new Error("lookup failed");
        const data = await res.json();
        if (typeof data?.display_name === "string") onAddressChange(data.display_name);
      } catch {
        setGeoNotice("Couldn't look up that address automatically — feel free to type it in.");
      } finally {
        setGeocoding(false);
      }
    },
    [onAddressChange],
  );

  const handlePick = useCallback(
    (loc: LatLng) => {
      setLocation(loc);
      setGeoNotice(null);
      reverseGeocode(loc);
    },
    [reverseGeocode],
  );

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGeoNotice("Your browser doesn't support GPS location.");
      return;
    }
    setLocating(true);
    setGeoNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setShowMap(true);
        handlePick({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setGeoNotice("Couldn't get your location — check location permissions, or pick on the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`flex items-start gap-2 px-3 rounded-xl bg-black/30 border transition-all ${
          error ? "border-red-500/60" : "border-white/10 focus-within:border-[#F1E6C3]"
        }`}
      >
        <MapPinpoint01Icon size={14} className="text-white/40 shrink-0 mt-3" />
        <textarea
          rows={2}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t("addressPlaceholder")}
          autoComplete="street-address"
          className="flex-1 min-w-0 bg-transparent py-2.5 text-xs text-white placeholder-white/30 outline-none resize-none"
        />
      </div>
      {error && <span className="block px-1 text-[10px] text-red-400 font-mono">{error}</span>}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleUseGps}
          disabled={locating}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/15 hover:border-[#F1E6C3]/60 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-white/70 hover:text-[#F1E6C3] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GpsSignal01Icon size={13} className="shrink-0" />
          <span>{locating ? "Locating…" : "Use My Location"}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowMap((s) => !s)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
            showMap
              ? "border-[#F1E6C3]/60 text-[#F1E6C3] bg-[#F1E6C3]/10"
              : "border-white/15 text-white/70 hover:border-[#F1E6C3]/60 hover:text-[#F1E6C3]"
          }`}
        >
          <MapPinpoint01Icon size={13} className="shrink-0" />
          <span>{showMap ? "Hide Map" : "Pick On Map"}</span>
        </button>
      </div>

      {geoNotice && <span className="block px-1 text-[10px] text-red-400 font-mono">{geoNotice}</span>}
      {geocoding && <span className="block px-1 text-[10px] text-white/40 font-mono">{t("lookingUp")}</span>}

      {showMap && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <DeliveryMapPicker center={location ?? DEFAULT_CENTER} onPick={handlePick} />
          <span className="block px-2 py-1.5 bg-black/40 text-[9px] font-mono text-white/40 text-center">
            {t("mapHint")}
          </span>
        </div>
      )}
    </div>
  );
}
