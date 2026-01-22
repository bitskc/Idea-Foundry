import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply dark mode based on system preference
function applyTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", prefersDark);
}

// Apply theme on load
applyTheme();

// Listen for system theme changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

createRoot(document.getElementById("root")!).render(<App />);
