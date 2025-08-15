// src/app/layout.tsx
import * as React from 'react';
import ThemeRegistry from '../ThemeRegistry';

export const metadata = {
  title: 'Barren River Lake Hub',
  description: 'Current water data for Barren River Lake, KY',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}