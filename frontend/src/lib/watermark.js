export const PRINT_WATERMARK_CSS = `
  body::before {
    content: "" !important;
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 450px !important;
    height: 450px !important;
    max-width: 65vw !important;
    max-height: 65vh !important;
    background-image: url('/company_logo.png') !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    background-size: contain !important;
    opacity: 0.08 !important;
    pointer-events: none !important;
    z-index: -1 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;
