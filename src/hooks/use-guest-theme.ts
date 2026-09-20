import { useEffect, useState } from "react";

// Guest pages have their own theme, fully independent from the admin theme
// (admin uses the "theme" localStorage key via @/hooks/use-theme). The guest
// preference lives under its own key "guest-theme", so toggling the admin's
// dark/light mode never affects guest pages and vice versa.
type GuestTheme = "light" | "dark";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function readStoredTheme(): GuestTheme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("guest-theme") as GuestTheme | null;
  if (stored === "light" || stored === "dark") return stored;
  // No explicit guest preference yet: default to the system preference.
  return getSystemTheme();
}

export function useGuestTheme() {
  const [theme, setTheme] = useState<GuestTheme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("guest-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme, isDark: theme === "dark" };
}