const CUSTOM_STYLE_ID = "zed-mpe-custom-style";

export function applyCustomStyle(css?: string): void {
  const existing = document.getElementById(CUSTOM_STYLE_ID);

  if (!css) {
    existing?.remove();
    return;
  }

  const styleElement = existing instanceof HTMLStyleElement ? existing : document.createElement("style");
  styleElement.id = CUSTOM_STYLE_ID;
  const nonce = document.body.dataset.styleNonce;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
  styleElement.textContent = css;

  if (!styleElement.parentElement) {
    document.head.appendChild(styleElement);
  }
}
