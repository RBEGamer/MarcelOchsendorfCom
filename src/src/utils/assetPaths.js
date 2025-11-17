const fallbackBase = import.meta.env.BASE_URL || '/';

const computeBaseUrl = () => {
  if (typeof document !== 'undefined' && document.baseURI) {
    return document.baseURI;
  }
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }
  try {
    return new URL(fallbackBase, 'http://localhost/').toString();
  } catch {
    return 'http://localhost/';
  }
};

const assetBase = computeBaseUrl();

const stripLeadingSlash = (value = '') =>
  value.startsWith('/') ? value.slice(1) : value;

export const resolveAssetUrl = (relativePath = '') =>
  new URL(stripLeadingSlash(relativePath), assetBase);
