"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Store,
  Camera,
  Image as ImageIcon,
  Copy,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Wifi,
  Save,
  Globe,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Eye,
  EyeOff,
  Navigation,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseSocialLink } from "@/lib/utils/social-verifier";
import { getTenantMenuUrl, getTenantDisplayDomain, getRootDomain } from "@/lib/utils/domain";

/**
 * Compresses an uploaded image file on the client-side and returns a compact base64 Data URL.
 * Prevents invalid blob URL persistence and reduces database storage footprint.
 */
function compressImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

const CUISINE_PRESETS = [
  { id: "burger", name: "🍔 Burgers & Sandwiches" },
  { id: "pizza", name: "🍕 Pizza & Italian" },
  { id: "grill", name: "🥩 Grills & BBQ" },
  { id: "cafe", name: "☕ Cafe & Beverages" },
  { id: "sweets", name: "🍰 Desserts & Bakery" },
  { id: "tacos", name: "🌮 Tacos & Mexican" },
  { id: "fastfood", name: "🍟 Fast Food" },
  { id: "traditional", name: "🍲 Traditional Dishes" },
  { id: "seafood", name: "🦐 Seafood" },
  { id: "healthy", name: "🥗 Healthy & Salads" },
];

const DAYS_OF_WEEK = [
  { id: "saturday", label: "Saturday", defaultOpen: "10:00", defaultClose: "23:30", isOpen: true },
  { id: "sunday", label: "Sunday", defaultOpen: "10:00", defaultClose: "23:30", isOpen: true },
  { id: "monday", label: "Monday", defaultOpen: "10:00", defaultClose: "23:30", isOpen: true },
  { id: "tuesday", label: "Tuesday", defaultOpen: "10:00", defaultClose: "23:30", isOpen: true },
  { id: "wednesday", label: "Wednesday", defaultOpen: "10:00", defaultClose: "23:30", isOpen: true },
  { id: "thursday", label: "Thursday", defaultOpen: "10:00", defaultClose: "00:00", isOpen: true },
  { id: "friday", label: "Friday", defaultOpen: "14:00", defaultClose: "00:00", isOpen: true },
];

export default function RestaurantProfilePage() {
  const [activeTab, setActiveTab] = useState<"brand" | "general" | "contact" | "hours" | "social">("brand");

  // 1. Branding & Subdomain State
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubdomainLocked, setIsSubdomainLocked] = useState(false);
  const [permanentSubdomain, setPermanentSubdomain] = useState("");
  const [inputSubdomain, setInputSubdomain] = useState("");
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [hasConfirmedLock, setHasConfirmedLock] = useState(false);
  const [showBrandClaimModal, setShowBrandClaimModal] = useState(false);
  const [copiedClaimEmail, setCopiedClaimEmail] = useState(false);

  // Subdomain Availability State
  const [availabilityState, setAvailabilityState] = useState<{
    checking: boolean;
    status:
      | "IDLE"
      | "AVAILABLE"
      | "TAKEN"
      | "SYSTEM_RESERVED"
      | "PROTECTED_BRAND"
      | "INVALID"
      | "INVALID_LENGTH"
      | "INVALID_FORMAT"
      | "CONSECUTIVE_HYPHENS"
      | "CURRENT"
      | "ERROR";
    message: string;
    canClaim?: boolean;
  }>({
    checking: false,
    status: "IDLE",
    message: "",
    canClaim: false,
  });

  // 2. General Information State
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [currency, setCurrency] = useState("DZD");
  const [description, setDescription] = useState("");

  // 3. Contact & Location State
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  // 4. Operating Hours State
  const [alwaysOpen, setAlwaysOpen] = useState(false);
  const [schedule, setSchedule] = useState(DAYS_OF_WEEK);

  // 5. Social & Amenities State
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  // 6. Online / Maintenance Status State
  const [status, setStatus] = useState<string>("ACTIVE");
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);

  // Instant Synchronous Verifications (0ms latency, zero server load)
  const googleMapsVerification = useMemo(() => {
    const trimmed = googleMapsUrl.trim();
    if (!trimmed) return { checking: false, status: "IDLE" as const, message: "" };
    const res = parseSocialLink(trimmed, "maps");
    return {
      checking: false,
      status: res.isValidPlatform ? ("VALID" as const) : ("INVALID_PLATFORM" as const),
      message: res.isValidPlatform ? "" : "Invalid link",
    };
  }, [googleMapsUrl]);

  const tiktokVerification = useMemo(() => {
    const trimmed = tiktok.trim();
    if (!trimmed) return { checking: false, status: "IDLE" as const };
    const res = parseSocialLink(trimmed, "tiktok");
    return {
      checking: false,
      status: res.isValidPlatform ? ("VALID" as const) : ("INVALID_PLATFORM" as const),
    };
  }, [tiktok]);

  const instagramVerification = useMemo(() => {
    const trimmed = instagram.trim();
    if (!trimmed) return { checking: false, status: "IDLE" as const };
    const res = parseSocialLink(trimmed, "instagram");
    return {
      checking: false,
      status: res.isValidPlatform ? ("VALID" as const) : ("INVALID_PLATFORM" as const),
    };
  }, [instagram]);

  const facebookVerification = useMemo(() => {
    const trimmed = facebook.trim();
    if (!trimmed) return { checking: false, status: "IDLE" as const };
    const res = parseSocialLink(trimmed, "facebook");
    return {
      checking: false,
      status: res.isValidPlatform ? ("VALID" as const) : ("INVALID_PLATFORM" as const),
    };
  }, [facebook]);

  // Save & Toast Notification State
  const [saving, setSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [initialData, setInitialData] = useState<any>({});
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "warning";
    message: string;
  }>({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success", duration = 3500) => {
    setToastNotification({ show: true, type, message });
    setTimeout(() => {
      setToastNotification((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  // Load initial restaurant profile from Database
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/restaurant/profile");
        const json = await res.json();
        if (json.success && json.restaurant) {
          const r = json.restaurant;
          const initialSchedule = Array.isArray(r.operatingHours) && r.operatingHours.length > 0 
            ? JSON.parse(JSON.stringify(r.operatingHours)) 
            : JSON.parse(JSON.stringify(DAYS_OF_WEEK));

          const loadedData = {
            name: r.name || "",
            tagline: r.tagline || "",
            description: r.description || "",
            currency: r.currency || "DZD",
            selectedCuisines: Array.isArray(r.cuisineTypes) ? r.cuisineTypes : [],
            phone: r.phone || "",
            whatsapp: r.whatsapp || "",
            city: r.city || "",
            address: r.address || "",
            googleMapsUrl: r.googleMapsUrl || "",
            alwaysOpen: !!r.alwaysOpen,
            schedule: initialSchedule,
            tiktok: r.tiktokUrl || "",
            instagram: r.instagramUrl || "",
            facebook: r.facebookUrl || "",
            wifiSsid: r.wifiSsid || "",
            wifiPassword: r.wifiPassword || "",
            logoPreview: r.logoUrl || null,
            coverPreview: r.coverUrl || null,
            inputSubdomain: r.slug || "",
            status: r.status || "ACTIVE",
          };

          setName(loadedData.name);
          setTagline(loadedData.tagline);
          setDescription(loadedData.description);
          setCurrency(loadedData.currency);
          setSelectedCuisines(loadedData.selectedCuisines);
          setPhone(loadedData.phone);
          setWhatsapp(loadedData.whatsapp);
          setCity(loadedData.city);
          setAddress(loadedData.address);
          setGoogleMapsUrl(loadedData.googleMapsUrl);
          setAlwaysOpen(loadedData.alwaysOpen);
          setSchedule(loadedData.schedule);
          setTiktok(loadedData.tiktok);
          setInstagram(loadedData.instagram);
          setFacebook(loadedData.facebook);
          setWifiSsid(loadedData.wifiSsid);
          setWifiPassword(loadedData.wifiPassword);
          setLogoPreview(loadedData.logoPreview);
          setCoverPreview(loadedData.coverPreview);
          setIsSubdomainLocked(!!r.isSubdomainLocked);
          setPermanentSubdomain(r.slug || "");
          setInputSubdomain(r.slug || "");
          setStatus(loadedData.status);

          setInitialData(loadedData);
          setInitialDataLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load restaurant profile:", err);
      }
    }
    loadProfile();
  }, []);

  // Compute isDirty: true if any field changed from saved initialData
  const isDirty = useMemo(() => {
    if (!initialDataLoaded) return false;
    return (
      name !== initialData.name ||
      tagline !== initialData.tagline ||
      description !== initialData.description ||
      currency !== initialData.currency ||
      JSON.stringify(selectedCuisines) !== JSON.stringify(initialData.selectedCuisines) ||
      phone !== initialData.phone ||
      whatsapp !== initialData.whatsapp ||
      city !== initialData.city ||
      address !== initialData.address ||
      googleMapsUrl !== initialData.googleMapsUrl ||
      alwaysOpen !== initialData.alwaysOpen ||
      JSON.stringify(schedule) !== JSON.stringify(initialData.schedule) ||
      tiktok !== initialData.tiktok ||
      instagram !== initialData.instagram ||
      facebook !== initialData.facebook ||
      wifiSsid !== initialData.wifiSsid ||
      wifiPassword !== initialData.wifiPassword ||
      logoPreview !== initialData.logoPreview ||
      coverPreview !== initialData.coverPreview ||
      (!isSubdomainLocked && inputSubdomain !== initialData.inputSubdomain)
    );
  }, [
    initialDataLoaded,
    initialData,
    name,
    tagline,
    description,
    currency,
    selectedCuisines,
    phone,
    whatsapp,
    city,
    address,
    googleMapsUrl,
    alwaysOpen,
    schedule,
    tiktok,
    instagram,
    facebook,
    wifiSsid,
    wifiPassword,
    logoPreview,
    coverPreview,
    inputSubdomain,
    isSubdomainLocked,
  ]);

  // Real-time Subdomain availability checker
  useEffect(() => {
    if (isSubdomainLocked) return;
    const query = inputSubdomain.trim().toLowerCase();

    if (!query) {
      setAvailabilityState({ checking: false, status: "IDLE", message: "", canClaim: false });
      return;
    }

    setAvailabilityState((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/restaurant/check-subdomain?slug=${encodeURIComponent(query)}`);
        const data = await res.json();

        setAvailabilityState({
          checking: false,
          status: data.status,
          message: data.message || "",
          canClaim: data.canClaim ?? false,
        });
      } catch (err) {
        setAvailabilityState({ checking: false, status: "AVAILABLE", message: "Available", canClaim: false });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [inputSubdomain, isSubdomainLocked]);

  const getMenuUrl = (subdomain: string) => {
    return getTenantMenuUrl(subdomain);
  };

  const handleCopySubdomain = () => {
    const domain = isSubdomainLocked ? permanentSubdomain : inputSubdomain;
    navigator.clipboard.writeText(getMenuUrl(domain));
    setCopiedSubdomain(true);
    setTimeout(() => setCopiedSubdomain(false), 2000);
  };

  const toggleCuisine = (id: string) => {
    if (selectedCuisines.includes(id)) {
      setSelectedCuisines(selectedCuisines.filter((c) => c !== id));
    } else {
      setSelectedCuisines([...selectedCuisines, id]);
    }
  };

  const handleDayToggle = (index: number) => {
    setSchedule((prev) =>
      prev.map((day, i) => (i === index ? { ...day, isOpen: !day.isOpen } : { ...day }))
    );
  };

  const handleTimeChange = (index: number, field: "defaultOpen" | "defaultClose", val: string) => {
    setSchedule((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: val } : { ...day }))
    );
  };

  const handleConfirmPermanentLock = async () => {
    const confirmed = inputSubdomain.toLowerCase().trim();
    try {
      const res = await fetch("/api/restaurant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: confirmed,
          isSubdomainLocked: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to lock subdomain.", "error");
        return;
      }
      setPermanentSubdomain(confirmed);
      setIsSubdomainLocked(true);
      setShowLockModal(false);
      setHasConfirmedLock(false);
      setInitialData((prev: any) => ({
        ...prev,
        inputSubdomain: confirmed,
      }));
      showToast(`🔒 Menu link locked: ${getTenantDisplayDomain(confirmed)}`, "success", 4000);
    } catch (err) {
      showToast("Failed to lock subdomain.", "error");
    }
  };

  const handleSave = async () => {
    // 1. Validate Google Maps Link (If entered, must be valid)
    if (googleMapsUrl.trim() && googleMapsVerification.status === "INVALID_PLATFORM") {
      setActiveTab("contact");
      showToast("Please enter a valid Google Maps link.", "error");
      setTimeout(() => {
        document.getElementById("input-google-maps")?.focus();
      }, 100);
      return;
    }

    // 2. Validate Social Links
    if (tiktok.trim() && tiktokVerification.status === "INVALID_PLATFORM") {
      setActiveTab("social");
      showToast("Please enter a valid TikTok link or username.", "error");
      setTimeout(() => {
        document.getElementById("input-tiktok")?.focus();
      }, 100);
      return;
    }

    if (instagram.trim() && instagramVerification.status === "INVALID_PLATFORM") {
      setActiveTab("social");
      showToast("Please enter a valid Instagram link or handle.", "error");
      setTimeout(() => {
        document.getElementById("input-instagram")?.focus();
      }, 100);
      return;
    }

    if (facebook.trim() && facebookVerification.status === "INVALID_PLATFORM") {
      setActiveTab("social");
      showToast("Please enter a valid Facebook link or page name.", "error");
      setTimeout(() => {
        document.getElementById("input-facebook")?.focus();
      }, 100);
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name,
        tagline,
        description,
        currency,
        cuisineTypes: selectedCuisines,
        phone,
        whatsapp,
        city,
        address,
        googleMapsUrl,
        alwaysOpen,
        operatingHours: schedule,
        tiktokUrl: tiktok,
        instagramUrl: instagram,
        facebookUrl: facebook,
        wifiSsid,
        wifiPassword,
        logoUrl: logoPreview,
        coverUrl: coverPreview,
        status,
      };

      const res = await fetch("/api/restaurant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save profile changes.", "error");
      } else {
        setInitialData({
          ...initialData,
          name,
          tagline,
          description,
          currency,
          selectedCuisines: [...selectedCuisines],
          phone,
          whatsapp,
          city,
          address,
          googleMapsUrl,
          alwaysOpen,
          schedule: JSON.parse(JSON.stringify(schedule)),
          tiktok,
          instagram,
          facebook,
          wifiSsid,
          wifiPassword,
          logoPreview,
          coverPreview,
          status,
        });
        showToast("Profile changes saved successfully!", "success");
      }
    } catch (err) {
      showToast("An error occurred while saving.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (newStatus: "ACTIVE" | "INACTIVE") => {
    try {
      setTogglingStatus(true);
      const res = await fetch("/api/restaurant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to update restaurant status.", "error");
      } else {
        setStatus(newStatus);
        setInitialData((prev: any) => ({ ...prev, status: newStatus }));
        showToast(
          newStatus === "ACTIVE"
            ? "🎉 Restaurant is now LIVE & Online for visitors!"
            : "⏸️ Restaurant is now in Maintenance Mode (Paused).",
          "success"
        );
      }
    } catch (err) {
      showToast("Failed to toggle status.", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FAF9F5] p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans pb-24 text-left">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#F3F0E6] shadow-xs">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0"
          >
            <Store size={26} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Restaurant Profile
              </h1>
              {isDirty && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage your brand, location, operating hours, and public menu link.
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          whileHover={isDirty && !saving ? { scale: 1.03 } : {}}
          whileTap={isDirty && !saving ? { scale: 0.97 } : {}}
          className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
            !isDirty || saving
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-500/20 cursor-pointer"
          } self-start sm:self-auto`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isDirty ? (
            <Sparkles size={16} className="text-yellow-100 animate-pulse" />
          ) : (
            <Save size={16} />
          )}
          <span>{isDirty ? "Save Changes" : "Saved"}</span>
        </motion.button>
      </div>

      {/* 1.1 Store Status & Maintenance Mode Switch */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#F3F0E6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            {status === "ACTIVE" ? (
              <Globe size={22} className="text-emerald-600" />
            ) : (
              <AlertCircle size={22} className="text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                Menu Visibility Status
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                  status === "ACTIVE"
                    ? "bg-emerald-100/70 text-emerald-800 border-emerald-200"
                    : "bg-amber-100/70 text-amber-800 border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>{status === "ACTIVE" ? "Live Online" : "Paused (Maintenance)"}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {status === "ACTIVE"
                ? "Your digital QR menu is live and active for all customers."
                : "Visitors see your branded maintenance card while you make updates."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          {/* Quick Preview Link */}
          <a
            href={`/m/${permanentSubdomain || inputSubdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition"
          >
            <Eye size={14} />
            <span>{status === "ACTIVE" ? "View Live Menu" : "Preview Maintenance"}</span>
          </a>

          {/* Toggle Switch Button */}
          <button
            type="button"
            onClick={() => handleToggleStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
            disabled={togglingStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 ${
              status === "ACTIVE"
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            {togglingStatus ? (
              <Loader2 size={14} className="animate-spin" />
            ) : status === "ACTIVE" ? (
              <EyeOff size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            <span>
              {togglingStatus
                ? "Updating..."
                : status === "ACTIVE"
                ? "Pause Website"
                : "Go Live"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs with Framer Motion Sliding Pill */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-[#F3F0E6] shadow-xs">
        {[
          { id: "brand", label: "Branding & Link", icon: Camera },
          { id: "general", label: "General Info", icon: Store },
          { id: "contact", label: "Location & Contact", icon: MapPin },
          { id: "hours", label: "Operating Hours", icon: Clock },
          { id: "social", label: "Social & Wi-Fi", icon: Wifi },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer select-none ${
                isActive ? "text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeProfileTabPill"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md shadow-amber-500/20"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"} />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. TABS CONTAINER WITH ANIMATE PRESENCE */}
      <AnimatePresence mode="wait">
        {/* TAB 1: BRANDING & MENU LINK */}
        {activeTab === "brand" && (
          <motion.div
            key="brand"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Cover Banner Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#F3F0E6] shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Cover Banner</h2>
                <p className="text-xs text-gray-500">Recommended: 1200 × 400 px (PNG, JPG, or WebP up to 5MB)</p>
              </div>

              <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-dashed border-[#F3F0E6] bg-amber-50/20 group transition-all duration-300 hover:border-amber-300/80 hover:shadow-md">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                      <ImageIcon size={22} />
                    </div>
                    <p className="text-xs font-bold text-gray-700">Upload your menu header banner</p>
                  </div>
                )}

                <label
                  className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-gray-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Camera size={14} className="text-amber-600" />
                  <span>{coverPreview ? "Change Image" : "Upload Banner"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await compressImageFile(file, 1200, 500, 0.85);
                          setCoverPreview(dataUrl);
                        } catch (err) {
                          console.error("Failed to process banner image:", err);
                        }
                      }
                    }}
                  />
                </label>

                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => setCoverPreview(null)}
                    className="absolute bottom-4 left-4 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Logo & Subdomain Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Logo Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#F3F0E6] shadow-xs flex flex-col items-center text-center justify-between">
                <div className="w-full text-left">
                  <h2 className="text-base font-bold text-gray-900">Logo</h2>
                  <p className="text-xs text-gray-500">Recommended: 500 × 500 px</p>
                </div>

                <div className="relative my-4">
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-[#F3F0E6] bg-amber-50/30 overflow-hidden flex items-center justify-center shadow-inner">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store size={32} className="text-amber-500/70" />
                    )}
                  </div>

                  <label
                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-tr from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl shadow-md flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Camera size={15} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await compressImageFile(file, 500, 500, 0.88);
                            setLogoPreview(dataUrl);
                          } catch (err) {
                            console.error("Failed to process logo image:", err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                <p className="text-[11px] text-gray-400">Displayed in header & QR codes</p>
              </div>

              {/* Subdomain Card */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-[#F3F0E6] shadow-xs flex flex-col justify-between">
                
                {!initialDataLoaded ? (
                  /* Loading Skeleton (Prevents momentary unlocked input flash on refresh) */
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-gray-200 rounded-md" />
                        <div className="h-3 w-48 bg-gray-100 rounded-md" />
                      </div>
                      <div className="h-6 w-16 bg-emerald-50 border border-emerald-100 rounded-full" />
                    </div>
                    <div className="h-14 bg-gray-50 border border-gray-100 rounded-2xl" />
                  </div>
                ) : isSubdomainLocked ? (
                  /* Locked Subdomain View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Public Menu Link</h2>
                        <p className="text-xs text-gray-500">Permanent link printed on your QR codes</p>
                      </div>
                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>Locked & Active</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/40 border border-emerald-200 rounded-2xl p-3.5">
                      <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-black text-emerald-950 px-2">
                        <Globe size={18} className="text-emerald-600 shrink-0" />
                        <span>{getMenuUrl(permanentSubdomain)}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleCopySubdomain}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          {copiedSubdomain ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedSubdomain ? "Copied!" : "Copy URL"}</span>
                        </motion.button>
                        <a
                          href={getMenuUrl(permanentSubdomain)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 transition-all"
                          title="Open Menu"
                        >
                          <Share2 size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Unlocked Subdomain View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Public Menu Link</h2>
                        <p className="text-xs text-gray-500">Choose your unique subdomain to generate table QR codes</p>
                      </div>

                      {availabilityState.checking ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Checking...</span>
                        </span>
                      ) : availabilityState.status === "AVAILABLE" || availabilityState.status === "CURRENT" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Available</span>
                        </span>
                      ) : availabilityState.status === "PROTECTED_BRAND" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200 shadow-xs">
                          <ShieldCheck size={13} className="text-purple-600" />
                          <span>Protected Brand</span>
                        </span>
                      ) : availabilityState.status === "SYSTEM_RESERVED" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300">
                          <span>🚫 System Reserved</span>
                        </span>
                      ) : availabilityState.status === "TAKEN" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          <AlertCircle size={12} />
                          <span>Taken</span>
                        </span>
                      ) : availabilityState.status === "INVALID" || availabilityState.status === "INVALID_LENGTH" || availabilityState.status === "INVALID_FORMAT" || availabilityState.status === "CONSECUTIVE_HYPHENS" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                          <AlertCircle size={12} />
                          <span>Invalid Format</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#FAF9F5] border border-amber-200/80 rounded-2xl p-2">
                      <div className="flex items-center flex-1 bg-white rounded-xl border border-amber-200/60 px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                        <span className="text-xs sm:text-sm font-bold text-gray-400 select-none">https://</span>
                        <input
                          type="text"
                          value={inputSubdomain}
                          onChange={(e) => setInputSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="your-restaurant"
                          className="flex-1 text-sm sm:text-base font-bold px-1.5 py-0.5 text-gray-900 focus:outline-none"
                        />
                        <span className="text-xs sm:text-sm font-bold text-gray-500 select-none">
                          .{getRootDomain()}
                        </span>
                      </div>

                      <motion.button
                        whileHover={
                          (availabilityState.status === "AVAILABLE" || availabilityState.status === "CURRENT") && !availabilityState.checking && inputSubdomain.trim()
                            ? { scale: 1.03 }
                            : {}
                        }
                        whileTap={
                          (availabilityState.status === "AVAILABLE" || availabilityState.status === "CURRENT") && !availabilityState.checking && inputSubdomain.trim()
                            ? { scale: 0.96 }
                            : {}
                        }
                        type="button"
                        disabled={
                          (availabilityState.status !== "AVAILABLE" && availabilityState.status !== "CURRENT") ||
                          availabilityState.checking ||
                          !inputSubdomain.trim()
                        }
                        onClick={() => setShowLockModal(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 shadow-xs"
                      >
                        <Lock size={14} />
                        <span>Lock & Set URL</span>
                      </motion.button>
                    </div>

                    {/* Contextual Notices */}
                    {availabilityState.status === "PROTECTED_BRAND" ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200 text-purple-900">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={20} className="text-purple-600 shrink-0" />
                          <p className="text-xs font-medium">
                            <strong className="font-bold text-purple-950">Protected Trademark:</strong> Reserved for the official franchise or brand.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowBrandClaimModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
                        >
                          <ShieldCheck size={14} />
                          <span>Claim Subdomain</span>
                        </button>
                      </div>
                    ) : availabilityState.status === "SYSTEM_RESERVED" ? (
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                        <Info size={16} className="text-slate-500 shrink-0" />
                        <span>This name is strictly reserved for platform infrastructure (e.g. system, admin, routing) and cannot be claimed.</span>
                      </div>
                    ) : availabilityState.status === "TAKEN" ? (
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-50/70 border border-red-200 text-red-700 text-xs font-medium">
                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                        <span>This subdomain is currently used by another restaurant. Please choose a different unique name.</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400">
                        💡 Once locked, this URL is permanent to ensure printed QR codes always work.
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GENERAL INFORMATION */}
        {activeTab === "general" && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3F0E6] shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">General Information</h2>
              <p className="text-xs text-gray-500">Essential information displayed in your menu header and About section.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Restaurant Name
                </label>
                <input
                  id="input-restaurant-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smash Burger & Grill"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Fresh gourmet burgers & artisanal shakes 🔥"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Menu Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-all"
                >
                  <option value="DZD">🇩🇿 Algerian Dinar (DZD / DA)</option>
                  <option value="SAR">🇸🇦 Saudi Riyal (SAR)</option>
                  <option value="EUR">🇪🇺 Euro (€ / EUR)</option>
                  <option value="USD">🇺🇸 US Dollar ($ / USD)</option>
                </select>
              </div>
            </div>

            {/* Cuisine Categories */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Cuisine Types (Select all that apply):
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_PRESETS.map((c) => {
                  const isSelected = selectedCuisines.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCuisine(c.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs border border-amber-600"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                      }`}
                    >
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* About Us */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">About Us</label>
                <span className="text-[11px] text-gray-400 font-mono">{description.length}/300</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell guests your story, cooking philosophy, and specialty dishes..."
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* TAB 3: LOCATION & CONTACT */}
        {activeTab === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3F0E6] shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">Location & Contact</h2>
              <p className="text-xs text-gray-500">Contact details and directions for your customers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="input-phone-number"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0550 12 34 56"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageCircle size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 0550 12 34 56"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">City / State</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Algiers"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Didouche Mourad Street"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            {/* Google Maps Link */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-800">
                  Google Maps Link
                </label>
                {googleMapsUrl.trim() && googleMapsVerification.status === "VALID" && (
                  <motion.a
                    whileHover={{ x: 2 }}
                    href={googleMapsUrl.startsWith("http") ? googleMapsUrl : `https://${googleMapsUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>Open Maps</span>
                    <Navigation size={12} />
                  </motion.a>
                )}
              </div>

              <div className="relative">
                <input
                  id="input-google-maps"
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none transition-all ${
                    googleMapsVerification.status === "INVALID_PLATFORM"
                      ? "border-red-300 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center">
                  <Navigation size={15} className="text-blue-600" />
                </div>
              </div>

              {googleMapsVerification.status === "INVALID_PLATFORM" && (
                <p className="text-xs font-bold text-red-600">Invalid link</p>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: OPERATING HOURS */}
        {activeTab === "hours" && (
          <motion.div
            key="hours"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3F0E6] shadow-xs space-y-6"
          >
            {/* Header & 24/7 Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Operating Hours</h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure your weekly opening and closing schedule for customers.</p>
              </div>

              <div className="flex items-center gap-3">
                {/* 24/7 Toggle */}
                <label className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <span className="text-xs font-bold text-gray-800 select-none">Open 24/7</span>
                  <input
                    type="checkbox"
                    checked={alwaysOpen}
                    onChange={(e) => setAlwaysOpen(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative" />
                </label>
              </div>
            </div>

            {!alwaysOpen ? (
              <div className="space-y-4">
                {/* Days List */}
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  {schedule.map((day, idx) => (
                    <div
                      key={day.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors ${
                        day.isOpen ? "bg-white hover:bg-gray-50/50" : "bg-gray-50/60"
                      }`}
                    >
                      {/* Left: Day Name & Toggle */}
                      <div className="flex items-center gap-3.5 min-w-[160px]">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={day.isOpen}
                            onChange={() => handleDayToggle(idx)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${day.isOpen ? "text-gray-900" : "text-gray-400"}`}>
                            {day.label}
                          </span>
                          {day.isOpen ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                      </div>

                      {/* Right: Time Selectors or Closed Badge */}
                      {day.isOpen ? (
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1.5 bg-[#FAF9F5] border border-gray-300 rounded-xl px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                            <span className="text-xs text-gray-400 font-medium">From:</span>
                            <input
                              type="time"
                              value={day.defaultOpen}
                              onChange={(e) => handleTimeChange(idx, "defaultOpen", e.target.value)}
                              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                            />
                          </div>

                          <span className="text-xs font-medium text-gray-400">to</span>

                          <div className="flex items-center gap-1.5 bg-[#FAF9F5] border border-gray-300 rounded-xl px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                            <span className="text-xs text-gray-400 font-medium">To:</span>
                            <input
                              type="time"
                              value={day.defaultClose}
                              onChange={(e) => handleTimeChange(idx, "defaultClose", e.target.value)}
                              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-200/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                          <span>Closed</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 24/7 Active State */
              <div className="p-8 text-center bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-2xl space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Clock size={24} />
                </div>
                <h3 className="text-sm font-bold text-emerald-950">24/7 Hours Active</h3>
                <p className="text-xs text-emerald-800/80 max-w-sm mx-auto">
                  Your restaurant is marked as open 24 hours a day, 7 days a week on the digital menu.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: SOCIAL & WI-FI */}
        {activeTab === "social" && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Social Links */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3F0E6] shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Social Profiles</h2>
                <p className="text-xs text-gray-500">Links displayed on your digital menu header.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* TikTok */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">TikTok</label>
                  <div className="relative">
                    <input
                      id="input-tiktok"
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@username"
                      className={`w-full pl-3.5 pr-8 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none transition-all ${
                        tiktokVerification.status === "INVALID_PLATFORM"
                          ? "border-red-300 bg-red-50/20 text-red-950 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      }`}
                    />
                  </div>
                  {tiktokVerification.status === "INVALID_PLATFORM" && (
                    <p className="text-xs font-bold text-red-600">Invalid link</p>
                  )}
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Instagram</label>
                  <div className="relative">
                    <input
                      id="input-instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className={`w-full pl-3.5 pr-8 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none transition-all ${
                        instagramVerification.status === "INVALID_PLATFORM"
                          ? "border-red-300 bg-red-50/20 text-red-950 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-gray-300 text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                      }`}
                    />
                  </div>
                  {instagramVerification.status === "INVALID_PLATFORM" && (
                    <p className="text-xs font-bold text-red-600">Invalid link</p>
                  )}
                </div>

                {/* Facebook */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Facebook</label>
                  <div className="relative">
                    <input
                      id="input-facebook"
                      type="text"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/pagename"
                      className={`w-full pl-3.5 pr-8 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none transition-all ${
                        facebookVerification.status === "INVALID_PLATFORM"
                          ? "border-red-300 bg-red-50/20 text-red-950 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      }`}
                    />
                  </div>
                  {facebookVerification.status === "INVALID_PLATFORM" && (
                    <p className="text-xs font-bold text-red-600">Invalid link</p>
                  )}
                </div>

              </div>
            </div>

            {/* Guest Wi-Fi */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3F0E6] shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Guest Wi-Fi</h2>
                <p className="text-xs text-gray-500">Allow customers to copy your Wi-Fi password directly from the menu.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Restaurant_Guest"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showWifiPassword ? "text" : "password"}
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Wi-Fi password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      onClick={() => setShowWifiPassword(!showWifiPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      {showWifiPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subdomain Lock Modal */}
      <AnimatePresence>
        {showLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLockModal(false)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 sm:p-7 space-y-4 z-10 text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lock size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">Lock Menu Subdomain</h3>
                <p className="text-xs text-gray-500 mt-1">
                  You are setting your permanent digital menu address to:
                </p>
                <p className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl font-mono text-xs font-bold text-amber-950">
                  {getTenantMenuUrl(inputSubdomain)}
                </p>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                This URL will be linked to your printed QR codes. Once confirmed, it cannot be renamed.
              </p>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConfirmedLock}
                  onChange={(e) => setHasConfirmedLock(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <span className="text-xs font-medium text-gray-700">
                  I confirm this subdomain is correct and ready to lock.
                </span>
              </label>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasConfirmedLock}
                  onClick={handleConfirmPermanentLock}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm & Lock
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Brand Claim Modal */}
        {showBrandClaimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrandClaimModal(false)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 space-y-4 z-10 text-left border border-purple-100"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Protected Brand Claim</h3>
                    <p className="text-xs text-gray-500">Official Brand & Franchise Verification</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBrandClaimModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Subdomain Pill */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-purple-950">
                  <Globe size={16} className="text-purple-600 shrink-0" />
                  <span>{getTenantMenuUrl(inputSubdomain)}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-200/60 text-purple-900 text-[11px] font-bold">
                  Trademark Shield
                </span>
              </div>

              {/* Requirements */}
              <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <p>
                  To prevent unauthorized impersonation and brand squatting, this subdomain is protected under enterprise trademark safeguards.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2.5">
                  <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span>📋</span> How to claim this subdomain:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-gray-600 pl-1">
                    <li>
                      Send a verification request from your <strong>official company email domain</strong> (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-purple-700 font-mono">@brand.com</code>).
                    </li>
                    <li>
                      Include your <strong>DZMenu account email</strong> and restaurant business registration or franchise proof.
                    </li>
                    <li>
                      Our team will verify the credentials and transfer the subdomain to your account.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Email Desk Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/40 border border-purple-200/60">
                <div>
                  <span className="text-[11px] text-gray-500 block">DZMenu Verification Desk:</span>
                  <span className="font-mono text-xs font-bold text-purple-950">claims@dzmenu.com</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("claims@dzmenu.com");
                    setCopiedClaimEmail(true);
                    setTimeout(() => setCopiedClaimEmail(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-purple-100/50 text-purple-700 text-xs font-bold border border-purple-200 cursor-pointer transition-all"
                >
                  {copiedClaimEmail ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedClaimEmail ? "Copied!" : "Copy Email"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBrandClaimModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <a
                  href={`mailto:claims@dzmenu.com?subject=${encodeURIComponent(`Brand Subdomain Claim Request: ${inputSubdomain}.dzmenu.com`)}&body=${encodeURIComponent(
                    `Hello DZMenu Verification Team,\n\nI am an authorized representative requesting to claim the protected subdomain: https://${inputSubdomain}.dzmenu.com\n\nBrand / Company Name: \nOfficial Corporate Email Domain: \nDZMenu Registered Account Email: \nContact Phone Number: \n\n[Please attach proof of brand representation or commercial registry copy]`
                  )}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  <ShieldCheck size={15} />
                  <span>Send Claim Request</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Save / Error Toast */}
      <AnimatePresence>
        {toastNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-bold backdrop-blur-md transition-all ${
              toastNotification.type === "error"
                ? "bg-red-950/95 text-red-100 border-red-800 shadow-red-950/40"
                : toastNotification.type === "warning"
                ? "bg-amber-950/95 text-amber-100 border-amber-800 shadow-amber-950/40"
                : "bg-gray-900 text-white border-gray-800 shadow-gray-900/40"
            }`}
          >
            {toastNotification.type === "error" ? (
              <AlertCircle size={18} className="text-red-400 shrink-0" />
            ) : toastNotification.type === "warning" ? (
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            <span>{toastNotification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
