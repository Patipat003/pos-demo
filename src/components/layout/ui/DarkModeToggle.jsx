import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi"; // ✅ Import Icons

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" || 
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="ml-4 rounded flex items-center transition-all duration-300"
    >
      {darkMode ? <HiMoon size={30} className="text-red-600" /> : <HiSun size={30} className="text-red-600" />}
    </button>
  );
};

export default DarkModeToggle;
