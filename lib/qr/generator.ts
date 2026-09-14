import QRCode from "qrcode";
import type { QrStudioSettings } from "@/types/qr-studio";

/**
 * Generates an ultra-crisp, high-fidelity SVG string for the QR code,
 * with optional embedded logo in the center shield.
 */
export async function generateQrSvg(
  content: string,
  settings: QrStudioSettings,
  logoUrl?: string | null
): Promise<string> {
  const hasLogo = Boolean(settings.logoEnabled && logoUrl);
  const rawSvg = await QRCode.toString(content.trim(), {
    type: "svg",
    margin: 3,
    errorCorrectionLevel: hasLogo ? "H" : "M", // High when logo occlusion present, Medium for clean rapid URL detection
    color: {
      dark: settings.foregroundColor || "#000000",
      light: settings.backgroundColor || "#FFFFFF",
    },
  });

  if (!settings.logoEnabled || !logoUrl) {
    return rawSvg;
  }

  // Inject center logo shield and image into the SVG
  const logoSize = Math.max(16, Math.min(32, settings.logoSize || 24)); // % of total width
  const centerPos = (100 - logoSize) / 2;
  const shieldRadius = settings.cornerStyle === "square" ? "2" : "6";

  const logoShieldSvg = `<!-- Center Logo Shield & Icon -->
  <rect x="${centerPos - 1.5}%" y="${centerPos - 1.5}%" width="${logoSize + 3}%" height="${logoSize + 3}%" rx="${shieldRadius}" fill="${settings.backgroundColor || '#FFFFFF'}" stroke="${settings.foregroundColor || '#18181B'}" stroke-width="1.2" stroke-opacity="0.15" />
  <defs>
    <clipPath id="qr-logo-clip">
      <rect x="${centerPos}%" y="${centerPos}%" width="${logoSize}%" height="${logoSize}%" rx="${shieldRadius}" />
    </clipPath>
  </defs>
  <image href="${logoUrl}" x="${centerPos}%" y="${centerPos}%" width="${logoSize}%" height="${logoSize}%" preserveAspectRatio="xMidYMid slice" clip-path="url(#qr-logo-clip)" />
</svg>`;

  return rawSvg.trim().replace(/<\/svg>$/, logoShieldSvg);
}

/**
 * Generates an ultra high-resolution PNG data URL (2048x2048 default)
 * suitable for printing on banners, menus, and table stands.
 */
export async function generateQrPngDataUrl(
  content: string,
  settings: QrStudioSettings,
  logoUrl?: string | null,
  size: number = 2048
): Promise<string> {
  const hasLogo = Boolean(settings.logoEnabled && logoUrl);

  if (typeof window === "undefined") {
    // Server-side fallback via QRCode library
    return QRCode.toDataURL(content.trim(), {
      width: size,
      margin: 3,
      errorCorrectionLevel: hasLogo ? "H" : "M",
      color: {
        dark: settings.foregroundColor || "#000000",
        light: settings.backgroundColor || "#FFFFFF",
      },
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, content.trim(), {
    width: size,
    margin: 3,
    errorCorrectionLevel: hasLogo ? "H" : "M",
    color: {
      dark: settings.foregroundColor || "#000000",
      light: settings.backgroundColor || "#FFFFFF",
    },
  });

  // If center logo enabled, draw logo shield on canvas
  if (settings.logoEnabled && logoUrl) {
    try {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const logo = await loadImage(logoUrl);
        const logoPct = (settings.logoSize || 24) / 100;
        const logoWidth = size * logoPct;
        const logoHeight = size * logoPct;
        const x = (size - logoWidth) / 2;
        const y = (size - logoHeight) / 2;

        const shieldPadding = size * 0.012;
        const radius = settings.cornerStyle === "square" ? 0 : size * 0.025;

        // Draw white background shield
        ctx.save();
        ctx.fillStyle = settings.backgroundColor || "#FFFFFF";
        ctx.beginPath();
        roundRect(
          ctx,
          x - shieldPadding,
          y - shieldPadding,
          logoWidth + shieldPadding * 2,
          logoHeight + shieldPadding * 2,
          radius
        );
        ctx.fill();

        // Optional subtle border on shield
        ctx.lineWidth = size * 0.003;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.stroke();

        // Clip and draw logo image
        ctx.beginPath();
        roundRect(ctx, x, y, logoWidth, logoHeight, radius * 0.8);
        ctx.clip();
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        ctx.restore();
      }
    } catch (e) {
      console.warn("Could not draw logo on QR canvas:", e);
    }
  }

  return canvas.toDataURL("image/png", 1.0);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Triggers client-side download of a file.
 */
export function downloadFile(dataUrlOrBlobUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrlOrBlobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
