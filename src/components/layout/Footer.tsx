import { FooterStyles } from '@styles/layout';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={FooterStyles.Footer}>
      <p>&copy; {year} akahtig. All rights reserved.</p>
    </footer>
  );
}
