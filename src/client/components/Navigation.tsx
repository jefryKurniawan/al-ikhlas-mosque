import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Menu, X, Landmark } from 'lucide-preact';

const links = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Jadwal Sholat', href: '#jadwal' },
  { label: 'Kegiatan', href: '#kegiatan' },
  { label: 'Donasi', href: '#qurban' },
  { label: 'Lokasi', href: '#lokasi' },
  { label: 'Kontak', href: '#kontak' },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav class={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <div class="nav__inner container">
        <a href="/" class="nav__brand">
          <Landmark size={18} />
          <span>Masjid Al Ikhlas Gonggang</span>
        </a>

        <ul class={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
          {links.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                class="nav__link"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          class="nav__toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
