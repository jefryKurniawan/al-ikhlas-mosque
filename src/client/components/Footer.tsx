import { h } from 'preact';
import { Landmark, Heart } from 'lucide-preact';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer class="footer">
      <div class="footer__inner container">
        <div class="footer__brand">
          <div class="footer__logo">
            <Landmark size={18} />
            <span>Masjid Al Ikhlas Gonggang</span>
          </div>
          <p class="footer__desc">
            Biung, Gonggang, Poncol, Magetan, Jawa Timur
          </p>
        </div>

        <div class="footer__links">
          <h4 class="footer__heading">Navigasi</h4>
          <ul>
            <li><a href="#beranda">Beranda</a></li>
            <li><a href="#jadwal">Jadwal Sholat</a></li>
            <li><a href="#kegiatan">Kegiatan</a></li>
            <li><a href="#qurban">Donasi</a></li>
          </ul>
        </div>

        <div class="footer__links">
          <h4 class="footer__heading">Layanan</h4>
          <ul>
            <li><a href="#laporan">Laporan Keuangan</a></li>
            <li><a href="/login">Login Pengurus</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="container">
          &copy; {year} Masjid Al Ikhlas Gonggang. Dibuat dengan{' '}
          <Heart size={12} class="footer__heart" /> untuk umat.
        </p>
      </div>
    </footer>
  );
}
