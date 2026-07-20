import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./context/ThemeContext";

import App from "./App.jsx";
import "./styles/global.css";

// Global URL rewriting patch to support testing on physical mobile phones
(function() {
  const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    // Dynamically fallback to the host IP of the machine serving the site
    return `http://${window.location.hostname}:5000`;
  };

  // Intercept fetch API requests
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') {
      const apiBase = getApiBase();
      input = input.replace('http://localhost:5000', apiBase)
                   .replace('http://127.0.0.1:5000', apiBase);
    }
    return originalFetch(input, init);
  };

  // Intercept media source bindings (Audio/Video tags) via property setter
  const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (originalSrcDescriptor) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      set: function(val) {
        if (typeof val === 'string') {
          const apiBase = getApiBase();
          val = val.replace('http://localhost:5000', apiBase)
                   .replace('http://127.0.0.1:5000', apiBase);
        }
        originalSrcDescriptor.set.call(this, val);
      },
      get: function() {
        return originalSrcDescriptor.get.call(this);
      },
      configurable: true,
      enumerable: true
    });
  }

  // Intercept attribute bindings (like src) set via React/DOM setAttribute
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (name === 'src' && typeof value === 'string') {
      const apiBase = getApiBase();
      value = value.replace('http://localhost:5000', apiBase)
                   .replace('http://127.0.0.1:5000', apiBase);
    }
    return originalSetAttribute.call(this, name, value);
  };
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);