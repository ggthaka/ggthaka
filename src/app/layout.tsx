import {
  AsideProvider,
  ModeProvider,
  ThemeProvider,
} from '@components/provider';
import { gantari } from '@fonts/variable';
import '../styles/global.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      data-theme='system'
    >
      <body className={gantari.className}>
        <ModeProvider>
          <ThemeProvider>
            <AsideProvider>{children}</AsideProvider>
          </ThemeProvider>
        </ModeProvider>
        <div id='screen-portal' />
      </body>
    </html>
  );
}
