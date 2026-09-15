import React from "react";

export interface StreamlineIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Streamline Core Solid: Menu / Restaurant Utensils & Plate
 */
export function StreamlineMenuSolid({
  size = 20,
  className = "",
  ...props
}: StreamlineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Streamline Core Solid: Food Menu / Restaurant Book */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 3C2.89543 3 2 3.89543 2 5V19C2 20.1046 2.89543 21 4 21H18.5C19.8807 21 21 19.8807 21 18.5V17.5C21 16.1193 19.8807 15 18.5 15H18V5C18 3.89543 17.1046 3 16 3H4ZM6 6.5C6 5.94772 6.44772 5.5 7 5.5H13C13.5523 5.5 14 5.94772 14 6.5C14 7.05228 13.5523 7.5 13 7.5H7C6.44772 7.5 6 7.05228 6 6.5ZM7 9.5C6.44772 9.5 6 9.94772 6 10.5C6 11.0523 6.44772 11.5 7 11.5H13C13.5523 11.5 14 11.0523 14 10.5C14 9.94772 13.5523 9.5 13 9.5H7ZM18.5 17H18V19H18.5C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 17.75C18.5 17.75 18.5 17 18.5 17Z"
      />
      <circle cx="10" cy="15.5" r="1.5" />
    </svg>
  );
}

/**
 * Streamline Core Solid: Themes & Design (Color Palette & Swatches)
 */
export function StreamlineThemesSolid({
  size = 20,
  className = "",
  ...props
}: StreamlineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Streamline Core Solid: Design Palette */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C13.6569 22 15 20.6569 15 19C15 18.2323 14.7118 17.5317 14.2372 17.0003C13.8052 16.5167 13.5455 15.8824 13.5455 15.1818C13.5455 13.6961 14.7416 12.5 16.2273 12.5H18C20.2091 12.5 22 10.7091 22 8.5C22 4.91015 17.5228 2 12 2ZM6.5 11.5C7.32843 11.5 8 10.8284 8 10C8 9.17157 7.32843 8.5 6.5 8.5C5.67157 8.5 5 9.17157 5 10C5 10.8284 5.67157 11.5 6.5 11.5ZM10 7.5C10.8284 7.5 11.5 6.82843 11.5 6C11.5 5.17157 10.8284 4.5 10 4.5C9.17157 4.5 8.5 5.17157 8.5 6C8.5 6.82843 9.17157 7.5 10 7.5ZM16.5 8.5C16.5 9.32843 15.8284 10 15 10C14.1716 10 13.5 9.32843 13.5 8.5C13.5 7.67157 14.1716 7 15 7C15.8284 7 16.5 7.67157 16.5 8.5ZM7.5 16C8.32843 16 9 15.3284 9 14.5C9 13.6716 8.32843 13 7.5 13C6.67157 13 6 13.6716 6 14.5C6 15.3284 6.67157 16 7.5 16Z"
      />
    </svg>
  );
}

/**
 * Streamline Core Solid: QR Code Studio
 */
export function StreamlineQRSolid({
  size = 20,
  className = "",
  ...props
}: StreamlineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Top Left Locator */}
      <path d="M2 3.5C2 2.67157 2.67157 2 3.5 2H8.5C9.32843 2 10 2.67157 10 3.5V8.5C10 9.32843 9.32843 10 8.5 10H3.5C2.67157 10 2 9.32843 2 8.5V3.5ZM4 4V8H8V4H4Z" />
      <rect x="5.25" y="5.25" width="1.5" height="1.5" rx="0.5" />

      {/* Top Right Locator */}
      <path d="M14 3.5C14 2.67157 14.6716 2 15.5 2H20.5C21.3284 2 22 2.67157 22 3.5V8.5C22 9.32843 21.3284 10 20.5 10H15.5C14.6716 10 14 9.32843 14 8.5V3.5ZM16 4V8H20V4H16Z" />
      <rect x="17.25" y="5.25" width="1.5" height="1.5" rx="0.5" />

      {/* Bottom Left Locator */}
      <path d="M2 15.5C2 14.6716 2.67157 14 3.5 14H8.5C9.32843 14 10 14.6716 10 15.5V20.5C10 21.3284 9.32843 22 8.5 22H3.5C2.67157 22 2 21.3284 2 20.5V15.5ZM4 16V20H8V16H4Z" />
      <rect x="5.25" y="17.25" width="1.5" height="1.5" rx="0.5" />

      {/* Data Matrix / Modules */}
      <rect x="11.5" y="2.5" width="1.5" height="2" rx="0.5" />
      <rect x="11.5" y="6" width="1.5" height="4" rx="0.5" />
      <rect x="11.5" y="11.5" width="2" height="2" rx="0.5" />
      <rect x="14.5" y="11.5" width="3.5" height="2" rx="0.5" />
      <rect x="19" y="11.5" width="3" height="2" rx="0.5" />
      <rect x="14.5" y="15" width="2" height="4" rx="0.5" />
      <rect x="18" y="15" width="4" height="2.5" rx="0.5" />
      <rect x="17.5" y="19" width="4.5" height="3" rx="0.5" />
      <rect x="11.5" y="15" width="1.5" height="7" rx="0.5" />
      <rect x="2" y="11.5" width="8" height="1.5" rx="0.5" />
    </svg>
  );
}

/**
 * Streamline Core Solid: Store / Restaurant Profile
 */
export function StreamlineProfileSolid({
  size = 20,
  className = "",
  ...props
}: StreamlineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Streamline Core Solid: Storefront */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.24 3.29C3.65 2.5 4.47 2 5.36 2H18.64C19.53 2 20.35 2.5 20.76 3.29L22.42 6.5C22.78 7.2 22.84 8.01 22.58 8.76C22.32 9.51 21.78 10.12 21.08 10.42C20.67 10.6 20.21 10.69 19.74 10.66C18.89 10.61 18.09 10.18 17.58 9.51C17.06 10.22 16.22 10.68 15.31 10.74C14.39 10.79 13.51 10.43 12.92 9.77C12.38 10.4 11.56 10.77 10.69 10.74C9.77 10.7 8.93 10.25 8.42 9.53C7.91 10.2 7.11 10.63 6.26 10.66C5.79 10.69 5.33 10.6 4.92 10.42C4.22 10.12 3.68 9.51 3.42 8.76C3.16 8.01 3.22 7.2 3.58 6.5L5.24 3.29H3.24ZM4 12.2V19.5C4 20.8807 5.11929 22 6.5 22H17.5C18.8807 22 20 20.8807 20 19.5V12.2C19.91 12.23 19.82 12.25 19.73 12.26C18.09 12.35 16.59 11.53 15.65 10.22C14.76 11.45 13.31 12.21 11.75 12.24C10.25 12.28 8.84 11.59 7.92 10.41C6.98 11.66 5.53 12.44 3.96 12.26C4.01 12.24 4.05 12.22 4.1 12.2H4ZM9 15C8.44772 15 8 15.4477 8 16V20H12V16C12 15.4477 11.5523 15 11 15H9Z"
      />
    </svg>
  );
}
