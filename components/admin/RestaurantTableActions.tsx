"use client";

import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import {
  MoreHorizontal,
  Zap,
  CalendarPlus,
  Gift,
  Ban,
  RotateCcw,
  AlertTriangle,
  X,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import type { AdminRestaurantRow } from "@/lib/db/queries";
import { PLAN_REGISTRY } from "@/constants/subscriptions";
import {
  activatePlanAction,
  extendSubscriptionAction,
  grantTrialAction,
  suspendRestaurantAction,
  reactivateRestaurantAction,
} from "@/lib/admin/actions";

interface RestaurantTableActionsProps {
  restaurant: AdminRestaurantRow;
}

type ModalType = "activate" | "extend" | "trial" | "suspend" | "reactivate" | null;

export function RestaurantTableActions({ restaurant }: RestaurantTableActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states for modals
  const [selectedPlan, setSelectedPlan] = useState("STANDARD");
  const [durationDays, setDurationDays] = useState<number | "">(365);
  const [trialDays, setTrialDays] = useState<number>(14);
  const [reason, setReason] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    if (isPending) return;
    setActiveModal(null);
    setActionError(null);
  }, [isPending]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Handle escape key to close modal or menu
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (activeModal) {
          closeModal();
        } else if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, isMenuOpen, closeModal]);

  const openModal = (type: ModalType) => {
    setIsMenuOpen(false);
    setActionError(null);
    setReason("");
    if (type === "activate") {
      setSelectedPlan("STANDARD");
      setDurationDays(365);
    } else if (type === "extend") {
      setDurationDays(30);
    } else if (type === "trial") {
      setTrialDays(14);
      setSelectedPlan("TRIAL");
    }
    setActiveModal(type);
  };

  // Lifecycle Action Handlers
  const handleActivatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const formData = new FormData();
    formData.set("restaurantId", restaurant.id);
    formData.set("planId", selectedPlan);
    if (durationDays !== "") {
      formData.set("durationDays", durationDays.toString());
    }
    if (reason.trim()) {
      formData.set("reason", reason.trim());
    }

    startTransition(async () => {
      const res = await activatePlanAction(formData);
      if (res.success) {
        closeModal();
      } else {
        setActionError(res.error || "Failed to activate plan");
      }
    });
  };

  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!durationDays || durationDays <= 0) {
      setActionError("Please enter a valid positive duration in days.");
      return;
    }

    const formData = new FormData();
    formData.set("restaurantId", restaurant.id);
    formData.set("durationDays", durationDays.toString());
    if (reason.trim()) {
      formData.set("reason", reason.trim());
    }

    startTransition(async () => {
      const res = await extendSubscriptionAction(formData);
      if (res.success) {
        closeModal();
      } else {
        setActionError(res.error || "Failed to extend subscription");
      }
    });
  };

  const handleGrantTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const formData = new FormData();
    formData.set("restaurantId", restaurant.id);
    formData.set("trialDays", trialDays.toString());
    if (reason.trim()) {
      formData.set("reason", reason.trim());
    }

    startTransition(async () => {
      const res = await grantTrialAction(formData);
      if (res.success) {
        closeModal();
      } else {
        setActionError(res.error || "Failed to grant trial");
      }
    });
  };

  const handleSuspendRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!reason.trim() || reason.trim().length < 2) {
      setActionError("Please provide a suspension reason (minimum 2 characters).");
      return;
    }

    const formData = new FormData();
    formData.set("restaurantId", restaurant.id);
    formData.set("reason", reason.trim());

    startTransition(async () => {
      const res = await suspendRestaurantAction(formData);
      if (res.success) {
        closeModal();
      } else {
        setActionError(res.error || "Failed to suspend restaurant");
      }
    });
  };

  const handleReactivateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const formData = new FormData();
    formData.set("restaurantId", restaurant.id);
    if (reason.trim()) {
      formData.set("reason", reason.trim());
    }

    startTransition(async () => {
      const res = await reactivateRestaurantAction(formData);
      if (res.success) {
        closeModal();
      } else {
        setActionError(res.error || "Failed to reactivate restaurant");
      }
    });
  };

  const isSuspended = restaurant.effectiveStatus === "SUSPENDED";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition focus:outline-none focus:ring-1 focus:ring-zinc-400"
        title="Manage restaurant lifecycle"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">Open actions menu for {restaurant.name}</span>
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-zinc-200/90 py-1 z-30 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-zinc-100">
            <p className="text-[11px] font-semibold text-zinc-900 truncate">
              {restaurant.name}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono truncate">
              /{restaurant.slug}
            </p>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => openModal("activate")}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition text-left"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Activate Plan</span>
            </button>

            <button
              type="button"
              onClick={() => openModal("extend")}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition text-left"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Extend Subscription</span>
            </button>

            <button
              type="button"
              onClick={() => openModal("trial")}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition text-left"
            >
              <Gift className="h-3.5 w-3.5 text-indigo-500" />
              <span>Grant Free Trial</span>
            </button>
          </div>

          <div className="border-t border-zinc-100 py-1">
            {isSuspended ? (
              <button
                type="button"
                onClick={() => openModal("reactivate")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 transition text-left font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                <span>Reactivate Restaurant</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openModal("suspend")}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition text-left font-medium"
              >
                <Ban className="h-3.5 w-3.5 text-rose-500" />
                <span>Suspend Restaurant</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ACTIVATE PLAN MODAL */}
      {/* ========================================================================= */}
      {activeModal === "activate" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200/60">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Activate Plan</h3>
                  <p className="text-xs text-zinc-500">Tenant: {restaurant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleActivatePlan} className="space-y-3.5">
              {/* Plan Picker */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Select Plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["STANDARD", "ECONOMY", "HIGH", "PRO"].map((pKey) => {
                    const planDef = PLAN_REGISTRY[pKey];
                    const isPicked = selectedPlan === pKey;
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => {
                          setSelectedPlan(pKey);
                          if (planDef) setDurationDays(planDef.defaultDurationDays);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                          isPicked
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                            : "bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        <span className="text-xs font-semibold">{planDef?.name || pKey}</span>
                        <span className={`text-[11px] font-mono mt-1 ${isPicked ? "text-zinc-300" : "text-zinc-500"}`}>
                          {planDef ? `${planDef.price.toLocaleString()} ${planDef.currency}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Presets & Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Duration (Days)
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  {[30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`px-2 py-1 text-xs font-mono rounded border transition ${
                        durationDays === d
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value, 10) : "")}
                  placeholder="Custom duration in days"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                  required
                />
              </div>

              {/* Operational Reason */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Bank transfer receipt #4928"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Activate Subscription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXTEND SUBSCRIPTION MODAL */}
      {/* ========================================================================= */}
      {activeModal === "extend" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <CalendarPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Extend Subscription</h3>
                  <p className="text-xs text-zinc-500">Tenant: {restaurant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExtendSubscription} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Extension Duration
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  {[7, 30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`px-2 py-1 text-xs font-mono rounded border transition ${
                        durationDays === d
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value, 10) : "")}
                  placeholder="Number of days"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Extension Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Courtesy renewal / Offline invoice"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Extension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GRANT TRIAL MODAL */}
      {/* ========================================================================= */}
      {activeModal === "trial" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Grant Free Trial</h3>
                  <p className="text-xs text-zinc-500">Tenant: {restaurant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleGrantTrial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Trial Duration
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTrialDays(d)}
                      className={`py-1.5 text-xs font-mono font-medium rounded-lg border transition ${
                        trialDays === d
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Onboarding pilot / Marketing demo"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Grant Trial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUSPEND RESTAURANT MODAL (DESTRUCTIVE CONFIRMATION) */}
      {/* ========================================================================= */}
      {activeModal === "suspend" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-rose-200 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/60">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Suspend Restaurant</h3>
                  <p className="text-xs text-rose-600">Consequential Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Suspending <span className="font-semibold text-zinc-900">{restaurant.name}</span> will immediately freeze customer menu access and lock owner administrative tools.
            </p>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSuspendRestaurant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Suspension Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Mandatory reason for audit trail (e.g. Terms of Service violation, payment dispute)..."
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-rose-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !reason.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Suspension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REACTIVATE RESTAURANT MODAL */}
      {/* ========================================================================= */}
      {activeModal === "reactivate" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-emerald-200 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Reactivate Restaurant</h3>
                  <p className="text-xs text-zinc-500">Tenant: {restaurant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Reactivating <span className="font-semibold text-zinc-900">{restaurant.name}</span> will restore tenant access according to their unexpired subscription timeline.
            </p>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleReactivateRestaurant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reactivation Note (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Account reinstated after review"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Reactivation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
