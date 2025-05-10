/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ✅ ใช้ class="dark" เพื่อควบคุมโหมดมืด
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // ✅ ปรับตามโครงสร้างโปรเจกต์
  ],
  theme: {
    extend: {
      keyframes: {
        "pulse-blink": {
          "0%, 100%": { backgroundColor: "#ef4444", opacity: "1" }, // สีแดง
          "50%": { backgroundColor: "#f87171", opacity: "0.5" }, // สีแดงอ่อน
        },
      },
      colors: {
        
        white: "var(--color-white)",
        black: "var(--color-black)",
        gray: {
          100: "var(--color-gray-100)",
          200: "var(--color-gray-200)",
          300: "var(--color-gray-300)",
          400: "var(--color-gray-400)",
          500: "var(--color-gray-500)",
          600: "var(--color-gray-600)",
          700: "var(--color-gray-700)",
        },
      },
      animation: {
        "pulse-blink": "pulse-blink 1.5s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["SF Pro Text", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: "Inter, sans-serif",
          },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
  ],
};
