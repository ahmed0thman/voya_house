import QRCode from "qrcode";

/** Dark-ink "VOYA HOUSE" wordmark — the same file used in the site header (there
 * inverted to white via CSS for the dark nav bar). Its native dark fill is what
 * we want here, sitting on a white plate. */
const LOGO_SRC = "/assets/logos/Asset 26.svg";

/** Fraction of the QR's width the pill-shaped logo plate spans — kept small so
 * the occluded area stays well inside the ~30% error-correction budget of
 * level "H", even though the wordmark's wide aspect ratio keeps it short. */
const PLATE_WIDTH_RATIO = 0.42;
const PLATE_HORIZONTAL_PADDING_RATIO = 0.14;
const PLATE_VERTICAL_PADDING_RATIO = 0.028;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}

/**
 * Renders a scannable QR code with the Voya wordmark centered on a white
 * pill. Error correction is forced to "H" (~30% recoverable) so the logo
 * overlay — a small fraction of the total area — never breaks a scan.
 */
export async function generateQrWithLogo(text: string, size = 512): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#111111", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");

  const logo = await loadImage(LOGO_SRC);
  const logoAspect = logo.naturalWidth / logo.naturalHeight;

  const plateWidth = size * PLATE_WIDTH_RATIO;
  const horizontalPadding = plateWidth * PLATE_HORIZONTAL_PADDING_RATIO;
  const logoW = plateWidth - horizontalPadding * 2;
  const logoH = logoW / logoAspect;
  const verticalPadding = size * PLATE_VERTICAL_PADDING_RATIO;
  const plateHeight = logoH + verticalPadding * 2;

  const plateX = (size - plateWidth) / 2;
  const plateY = (size - plateHeight) / 2;

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, plateHeight / 2);
  ctx.fill();
  ctx.strokeStyle = "#e5ded0";
  ctx.lineWidth = Math.max(1, size * 0.004);
  ctx.stroke();

  ctx.drawImage(logo, (size - logoW) / 2, (size - logoH) / 2, logoW, logoH);

  return canvas.toDataURL("image/png");
}
