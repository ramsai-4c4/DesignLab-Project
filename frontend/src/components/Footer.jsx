export default function Footer() {
  return (
    <footer className="text-center text-sm text-gray-200 py-6 bg-gradient-to-r from-brand-700 to-brand-600">
      &copy; {new Date().getFullYear()} LinkVault &mdash; Secure text &amp; file sharing
    </footer>
  );
}
