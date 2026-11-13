// src/utils/urlToken.js
export const getUrlToken = () => {
  // BrowserRouter case: /onboarding/upload?token=xyz
  const search = window.location.search;
  if (search) {
    const t = new URLSearchParams(search).get("token");
    if (t) return t;
  }

  // HashRouter case: #/onboarding/upload?token=xyz
  const hash = window.location.hash || "";
  const q = hash.indexOf("?");
  if (q !== -1) {
    return new URLSearchParams(hash.slice(q + 1)).get("token") || "";
  }
  return "";
};