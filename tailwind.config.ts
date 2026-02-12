import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: "#1a1a2e",
          surface: "#16213e",
          panel: "#0f3460",
          accent: "#e94560",
          text: "#eaeaea",
          muted: "#8892b0",
          track: "#1e2a4a",
          clip: {
            video: "#e94560",
            audio: "#00b4d8",
            text: "#ffd166",
            image: "#06d6a0",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
