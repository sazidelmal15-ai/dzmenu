"use client";

import React, { useState, useEffect } from "react";
import { X, Printer, Wifi, ChevronLeft, ChevronRight } from "lucide-react";
import type { QrStudioSettings } from "@/types/qr-studio";
import { generateQrSvg } from "@/lib/qr/generator";

interface PrintableStandModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: {
    name: string;
    slug: string;
    logoUrl: string | null;
    wifiSsid?: string;
    wifiPassword?: string;
  };
  settings: QrStudioSettings;
  subdomainBaseUrl: string;
}

interface TableCardItem {
  tableNumber: string;
  qrSvg: string;
  url: string;
}

export function PrintableStandModal({
  isOpen,
  onClose,
  restaurant,
  settings,
  subdomainBaseUrl,
}: PrintableStandModalProps) {
  const [cards, setCards] = useState<TableCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPreviewIdx, setCurrentPreviewIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function generateCards() {
      setLoading(true);
      const generated: TableCardItem[] = [];

      const isTableMode = settings.tableMode === "table";
      const count = isTableMode ? Math.max(1, Math.min(100, settings.tableCount || 10)) : 1;

      for (let i = 1; i <= count; i++) {
        const tableNum = isTableMode ? String(i) : "";
        const url = `${subdomainBaseUrl}/qr`;

        const svg = await generateQrSvg(url, settings, restaurant.logoUrl);
        generated.push({
          tableNumber: tableNum,
          qrSvg: svg,
          url,
        });
      }

      if (isMounted) {
        setCards(generated);
        setLoading(false);
      }
    }

    generateCards();
    return () => {
      isMounted = false;
    };
  }, [isOpen, settings, subdomainBaseUrl, restaurant.logoUrl]);

  if (!isOpen) return null;

  const currentCard = cards[currentPreviewIdx] || cards[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Screen Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Print Table Stands ({cards.length} {cards.length === 1 ? "Card" : "Cards"})
              </h2>
              <p className="text-xs text-gray-500">
                Ready to print for acrylic stands, table tents, and stickers (A5 / A6 format)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print All Cards</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Interactive Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F6F6F7] flex flex-col items-center justify-center min-h-[420px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Generating print-ready vector cards...</span>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              {/* Stand Card Display (A5 Ratio mockup: 148mm x 210mm) */}
              <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-xl border border-gray-200/80 p-6 flex flex-col items-center justify-between text-center min-h-[460px] relative transition-all">
                {/* Header: Restaurant Branding */}
                <div className="space-y-2 pt-2">
                  {restaurant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      className="w-14 h-14 rounded-2xl object-cover mx-auto shadow-xs border border-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto font-black shadow-xs">
                      🍽️
                    </div>
                  )}
                  <h3 className="text-base font-black text-gray-900 tracking-tight">
                    {restaurant.name}
                  </h3>
                </div>

                {/* Center: Vector QR Code */}
                <div className="my-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-[200px] w-full aspect-square flex items-center justify-center">
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: currentCard.qrSvg }}
                  />
                </div>

                {/* Bottom: CTA text & Table / Wi-Fi badge */}
                <div className="w-full space-y-2.5 pb-2">
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                    {settings.ctaText || "امسح لعرض القائمة • Scan for Menu"}
                  </div>

                  {currentCard.tableNumber && (
                    <div className="text-xs font-black text-gray-800 bg-gray-50 py-1 px-3 rounded-lg border border-gray-200 inline-block">
                      طاولة Table #{currentCard.tableNumber}
                    </div>
                  )}

                  {settings.includeWifi && (settings.wifiSsid || restaurant.wifiSsid) && (
                    <div className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 p-2 rounded-xl flex items-center justify-center gap-3">
                      <span className="flex items-center gap-1 font-semibold">
                        <Wifi size={13} className="text-amber-500" />
                        <span>{settings.wifiSsid || restaurant.wifiSsid}</span>
                      </span>
                      {(settings.wifiPassword || restaurant.wifiPassword) && (
                        <span className="text-gray-400">
                          Pass: <strong className="text-gray-800">{settings.wifiPassword || restaurant.wifiPassword}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-card Carousel Pagination */}
              {cards.length > 1 && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPreviewIdx((p) => Math.max(0, p - 1))}
                    disabled={currentPreviewIdx === 0}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-40 text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-gray-600">
                    Card {currentPreviewIdx + 1} of {cards.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPreviewIdx((p) => Math.min(cards.length - 1, p + 1))}
                    disabled={currentPreviewIdx === cards.length - 1}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-40 text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN PRINT-ONLY CONTAINER (Standard @media print Engine)                 */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dzmenu-print-container,
          #dzmenu-print-container * {
            visibility: visible;
          }
          #dzmenu-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            padding: 0;
            margin: 0;
          }
          .dz-print-page {
            page-break-after: always;
            page-break-inside: avoid;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24mm;
            text-align: center;
            box-sizing: border-box;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div id="dzmenu-print-container" className="hidden print:block">
        {cards.map((card, idx) => (
          <div key={idx} className="dz-print-page">
            <div
              style={{
                width: "120mm",
                minHeight: "170mm",
                border: "1.5pt solid #e2e8f0",
                borderRadius: "16pt",
                padding: "16mm",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "center",
                boxSizing: "border-box",
                background: "#ffffff",
              }}
            >
              {/* Brand Header */}
              <div>
                {restaurant.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    style={{
                      width: "20mm",
                      height: "20mm",
                      borderRadius: "6mm",
                      objectFit: "cover",
                      margin: "0 auto 4mm auto",
                      border: "1pt solid #f1f5f9",
                    }}
                  />
                )}
                <h1
                  style={{
                    fontSize: "20pt",
                    fontWeight: 900,
                    margin: 0,
                    color: "#0f172a",
                    letterSpacing: "-0.5pt",
                  }}
                >
                  {restaurant.name}
                </h1>
              </div>

              {/* Printable Vector QR Code */}
              <div
                style={{
                  width: "70mm",
                  height: "70mm",
                  margin: "6mm 0",
                }}
                dangerouslySetInnerHTML={{ __html: card.qrSvg }}
              />

              {/* Call to Action & Table number */}
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    fontSize: "12pt",
                    fontWeight: 800,
                    padding: "3mm 6mm",
                    background: "#fef3c7",
                    color: "#78350f",
                    borderRadius: "20pt",
                    display: "inline-block",
                    marginBottom: "3mm",
                  }}
                >
                  {settings.ctaText || "امسح لعرض القائمة • Scan for Menu"}
                </div>

                {card.tableNumber && (
                  <div
                    style={{
                      fontSize: "14pt",
                      fontWeight: 900,
                      color: "#1e293b",
                      marginTop: "2mm",
                    }}
                  >
                    طاولة / Table #{card.tableNumber}
                  </div>
                )}

                {settings.includeWifi && (settings.wifiSsid || restaurant.wifiSsid) && (
                  <div
                    style={{
                      fontSize: "9pt",
                      color: "#475569",
                      marginTop: "3mm",
                      borderTop: "1pt solid #e2e8f0",
                      paddingTop: "2mm",
                    }}
                  >
                    📶 Wi-Fi: <strong>{settings.wifiSsid || restaurant.wifiSsid}</strong>
                    {(settings.wifiPassword || restaurant.wifiPassword) && (
                      <span> | Pass: <strong>{settings.wifiPassword || restaurant.wifiPassword}</strong></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
