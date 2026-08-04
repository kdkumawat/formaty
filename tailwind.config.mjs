/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    // Disable align-content utilities to avoid conflict with daisyui
    alignContent: false,
  },
  // Optional: daisyui configuration if needed
  daisyui: {
    themes: ["light", "dark"],
  },
};