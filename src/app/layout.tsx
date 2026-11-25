import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif-face",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const sans = Manrope({ variable: "--font-sans-face", subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Арча Терраса — бронирование столиков, Бишкек",
  description: "Ресторан кыргызской и европейской кухни на Токтогула. Забронируйте столик онлайн за минуту.",
};

export const viewport: Viewport = { themeColor: "#0c0a08", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        
      </body>
    </html>
  );
}
