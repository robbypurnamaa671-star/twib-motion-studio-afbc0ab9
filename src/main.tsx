import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { detectGeoLanguage } from "./i18n";

// Force dark mode
document.documentElement.classList.add("dark");

// Auto-detect Indonesian visitors on first load (no-op if user already chose)
detectGeoLanguage();

createRoot(document.getElementById("root")!).render(<App />);
