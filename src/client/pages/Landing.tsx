import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  Clock,
  CalendarDays,
  MapPin,
  ChevronRight,
  Loader2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Phone,
  MessageCircle,
  Mail,
} from 'lucide-preact';
import { useApi } from '../hooks/useApi';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import type { PrayerTime, Activity, QurbanTier } from '../../shared/types';
import s from '../styles/landing.module.css';

interface Props {
  path?: string;
}

export function Landing(_props: Props) {
  const { data: prayers, loading: prayersLoading, error: prayersError } = useApi<PrayerTime[]>(
    '/api/prayer-times'
  );
  const { data: activities, loading: activitiesLoading } = useApi<Activity[]>(
    '/api/activities'
  );
  const { data: qurbanTiers, loading: qurbanLoading } = useApi<QurbanTier[]>(
    '/api/qurban-tiers'
  );

  return (
    <div class="page-enter">
      <HeroSection />
      <PrayerSection
        prayers={prayers}
        loading={prayersLoading}
        error={prayersError}
      />
      <AboutSection />
      <ActivitiesSection activities={activities} loading={activitiesLoading} />
      <QurbanSection tiers={qurbanTiers} loading={qurbanLoading} />
      <FAQSection />
      <LocationSection />
      <ContactSection />
    </div>
  );
}

/* ========== Hero ========== */
function HeroSection() {
  return (
    <section id="beranda" class={s.hero}>
      <div class={s.heroPattern} />
      <div class={`container ${s.heroContent}`}>
        <div class={s.heroBadge}>
          <MapPin size={14} />
          <span>Gonggang, Poncol, Magetan</span>
        </div>
        <h1 class={s.heroTitle}>
          Masjid<br />Al Ikhlas Gonggang
        </h1>
        <p class={s.heroSubtitle}>
          Rumah ibadah umat Islam di Dukuh Gonggang, Kec. Poncol, Kab. Magetan. Mari bersama membangun keimanan, menuntut ilmu, dan melayani masyarakat.
        </p>
        <div class={s.heroActions}>
          <a href="#jadwal" class="btn btn-primary">
            <Clock size={16} />
            Jadwal Sholat
          </a>
          <a href="#kegiatan" class="btn btn-ghost">
            <CalendarDays size={16} />
            Kegiatan
          </a>
        </div>
      </div>
    </section>
  );
}

/* ========== Prayer Times ========== */
function getNextPrayerIndex(prayers: PrayerTime[]): number {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < prayers.length; i++) {
    const [h, m] = prayers[i].time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > nowMinutes) return i;
  }

  // All prayers passed — next is Subuh (tomorrow)
  return 0;
}

function PrayerSection({
  prayers,
  loading,
  error,
}: {
  prayers: PrayerTime[] | null;
  loading: boolean;
  error: string | null;
}) {
  const ref = useScrollReveal();
  const nextIndex = prayers ? getNextPrayerIndex(prayers) : -1;

  return (
    <section id="jadwal" class={`section ${s.prayer}`} ref={ref as never}>
      <div class="container">
        <div class="section-header">
          <h2>
            <Clock size={24} /> Jadwal Sholat Hari Ini
          </h2>
          <p>Jadwal sholat untuk wilayah Poncol, Magetan dan sekitarnya</p>
        </div>

        {loading && (
          <div class={s.loader}>
            <Loader2 size={24} class="spin" />
            <span>Mengambil jadwal...</span>
          </div>
        )}

        {error && (
          <div class={s.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              class="btn btn-ghost"
              onClick={() => window.location.reload()}
            >
              Muat Ulang
            </button>
          </div>
        )}

        {prayers && (
          <div class={s.prayerGrid}>
            {prayers.map((p, i) => (
              <PrayerTimeCard key={p.name} name={p.name} time={p.time} isNext={i === nextIndex} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ========== About ========== */
function AboutSection() {
  const ref = useScrollReveal();

  return (
    <section class={`section ${s.about}`} ref={ref as never}>
      <div class={`container ${s.aboutGrid}`}>
        <div class={s.aboutContent}>
          <h2>Tentang Masjid Al Ikhlas Gonggang</h2>
          <p>
            Masjid Al Ikhlas Gonggang berdiri sebagai pusat kegiatan keagamaan dan sosial
            masyarakat Desa Gonggang, Kecamatan Poncol, Kabupaten Magetan.
            Selain menjadi tempat ibadah lima waktu, masjid ini aktif menyelenggarakan
            pengajian, kegiatan sosial, dan program qurban setiap tahun.
          </p>
          <p>
            Dengan transparansi keuangan yang dikelola oleh pengurus, setiap rupiah
            yang tercatat dapat dipertanggungjawabkan untuk kemaslahatan umat.
          </p>
          <a href="#lokasi" class="btn btn-ghost">
            <MapPin size={16} />
            Kunjungi Kami
            <ChevronRight size={14} />
          </a>
        </div>
        <div class={s.aboutVisual}>
          <div class={s.aboutCard}>
            <div class={s.aboutStat}>
              <span class={s.aboutStatNumber}>5</span>
              <span class={s.aboutStatLabel}>Waktu Sholat Berjamaah</span>
            </div>
            <div class={s.aboutStat}>
              <span class={s.aboutStatNumber}>8+</span>
              <span class={s.aboutStatLabel}>Kegiatan Rutin</span>
            </div>
            <div class={s.aboutStat}>
              <span class={s.aboutStatNumber}>100%</span>
              <span class={s.aboutStatLabel}>Transparansi Keuangan</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== Activities ========== */
function ActivitiesSection({
  activities,
  loading,
}: {
  activities: Activity[] | null;
  loading: boolean;
}) {
  const ref = useScrollReveal();

  return (
    <section id="kegiatan" class={`section ${s.activities}`} ref={ref as never}>
      <div class="container">
        <div class="section-header">
          <h2>
            <CalendarDays size={24} /> Kegiatan Masjid
          </h2>
          <p>Kegiatan rutin dan acara khusus yang diselenggarakan masjid</p>
        </div>

        {loading && (
          <div class={s.loader}>
            <Loader2 size={24} class="spin" />
            <span>Memuat kegiatan...</span>
          </div>
        )}

        {activities && activities.length > 0 && (
          <div class={s.activityGrid}>
            {activities.map(a => (
              <div key={a.id} class={`card ${s.activityCard}`}>
                {a.imageUrl && (
                  <div class={s.activityImage}>
                    <img src={a.imageUrl} alt={a.title} loading="lazy" />
                  </div>
                )}
                <div class={s.activityContent}>
                  <div class={s.activityDate}>
                    <CalendarDays size={16} />
                    <span>{formatDate(a.eventDate)}</span>
                  </div>
                  <h3 class={s.activityTitle}>{a.title}</h3>
                  <p class={s.activityDesc}>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activities && activities.length === 0 && (
          <p class={s.empty}>Belum ada kegiatan terjadwal.</p>
        )}
      </div>
    </section>
  );
}

/* ========== Qurban ========== */
function QurbanSection({
  tiers,
  loading,
}: {
  tiers: QurbanTier[] | null;
  loading: boolean;
}) {
  const ref = useScrollReveal();

  return (
    <section id="qurban" class={`section ${s.qurban}`} ref={ref as never}>
      <div class="container">
        <div class="section-header">
          <h2>Qurban & Sedekah</h2>
          <p>Salurkan donasi qurban, sedekah, dan hibah melalui masjid untuk kemaslahatan umat.</p>
        </div>

        <div class={s.donationCarousel}>
          <div class={s.donationTrack}>
            <div class={s.donationSlide}>
              <img src="/images/kurban-sapi.webp" alt="Kurban Sapi" loading="lazy" />
              <div class={s.donationOverlay}>
                <span class={s.donationBadge}>Qurban</span>
                <h3>Pelaksanaan Kurban Idul Adha</h3>
                <p>Distribusi daging kurban untuk mustahik</p>
              </div>
            </div>
            <div class={s.donationSlide}>
              <img src="/images/santunan-yatim.webp" alt="Santunan Yatim" loading="lazy" />
              <div class={s.donationOverlay}>
                <span class={s.donationBadge}>Sedekah</span>
                <h3>Santunan Anak Yatim</h3>
                <p>Kegiatan bersama yatim dan dhuafa</p>
              </div>
            </div>
            <div class={s.donationSlide}>
              <img src="/images/pembangunan-masjid.webp" alt="Pembangunan Masjid" loading="lazy" />
              <div class={s.donationOverlay}>
                <span class={s.donationBadge}>Infak</span>
                <h3>Pembangunan Masjid</h3>
                <p>Proses pembangunan dan renovasi</p>
              </div>
            </div>
            {/* Duplicate for seamless loop */}
            <div class={s.donationSlide}>
              <img src="/images/kurban-sapi.webp" alt="Kurban Sapi" loading="lazy" />
              <div class={s.donationOverlay}>
                <span class={s.donationBadge}>Qurban</span>
                <h3>Pelaksanaan Kurban Idul Adha</h3>
                <p>Distribusi daging kurban untuk mustahik</p>
              </div>
            </div>
            <div class={s.donationSlide}>
              <img src="/images/santunan-yatim.webp" alt="Santunan Yatim" loading="lazy" />
              <div class={s.donationOverlay}>
                <span class={s.donationBadge}>Sedekah</span>
                <h3>Santunan Anak Yatim</h3>
                <p>Kegiatan bersama yatim dan dhuafa</p>
              </div>
            </div>
            <div class={s.donationSlide}>
              <img src="/images/pembangunan-masjid.webp" alt="Pembangunan Masjid" loading="lazy" />
              <div class={s.donationOverlay}>
                <span class={s.donationBadge}>Infak</span>
                <h3>Pembangunan Masjid</h3>
                <p>Proses pembangunan dan renovasi</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div class={s.loader}>
            <Loader2 size={24} class="spin" />
            <span>Memuat paket...</span>
          </div>
        )}

        {tiers && tiers.length > 0 && (
          <div class={s.qurbanGrid}>
            {tiers.map(t => (
              <div key={t.id} class={`card ${s.qurbanCard}`}>
                {t.imageUrl && (
                  <div class={s.qurbanImage}>
                    <img src={t.imageUrl} alt={t.name} loading="lazy" />
                  </div>
                )}
                <div class={s.qurbanContent}>
                  <h3 class={s.qurbanName}>{t.name}</h3>
                  <div class={s.qurbanPrice}>
                    <span class={s.qurbanAmount}>
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                  <p class={s.qurbanDesc}>{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ========== Location ========== */
function LocationSection() {
  const ref = useScrollReveal();

  return (
    <section id="lokasi" class={`section ${s.location}`} ref={ref as never}>
      <div class={`container ${s.locationGrid}`}>
        <div class={s.locationInfo}>
          <h2>
            <MapPin size={24} /> Lokasi
          </h2>
          <div class={s.locationAddress}>
            <MapPin size={16} />
            <div>
              <strong>Masjid Al Ikhlas Gonggang</strong>
              <p>Biung, Gonggang, Poncol<br />Magetan, Jawa Timur</p>
            </div>
          </div>
          <a
            href="https://maps.google.com/?q=-7.722194,111.234055"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary"
          >
            <ExternalLink size={16} />
            Buka di Google Maps
          </a>
        </div>

        <div class={s.locationMap}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d603.8629029815575!2d111.23457113289467!3d-7.722114189153391!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sid!4v1780284093507!5m2!1sen!2sid"
            width="100%"
            height="100%"
            style="border:0; border-radius: 12px; min-height: 300px;"
            allowFullScreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

/* ========== FAQ ========== */
function FAQSection() {
  const ref = useScrollReveal();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Bagaimana cara menyalurkan sedekah?',
      a: 'Bisa langsung ke masjid atau transfer ke rekening resmi masjid. Untuk nomor rekening dan konfirmasi, silakan hubungi pengurus melalui WhatsApp.',
    },
    {
      q: 'Bagaimana cara mendaftar qurban?',
      a: 'Datang langsung ke masjid atau hubungi pengurus. Pembayaran bisa tunai atau transfer. Pendaftaran dibuka 1-2 bulan sebelum Hari Raya Idul Adha.',
    },
    {
      q: 'Apakah ada laporan keuangan masjid?',
      a: 'Ada. Laporan keuangan masjid dipublikasikan setiap bulan dan bisa dilihat di menu Laporan Keuangan pada website ini.',
    },
    {
      q: 'Berapa minimal sedekah?',
      a: 'Tidak ada batas minimal. Berapapun nilainya, yang penting niat ikhlas. Sedekah bisa berupa uang, makanan, atau barang.',
    },
    {
      q: 'Bisa pakai masjid untuk acara?',
      a: 'Bisa. Silakan hubungi pengurus masjid untuk mengajukan izin. Masjid bisa dipakai untuk acara pengajian, pernikahan, dan kegiatan sosial lainnya.',
    },
  ];

  return (
    <section class={`section ${s.faq}`} ref={ref as never}>
      <div class="container">
        <div class="section-header">
          <h2>
            <HelpCircle size={24} /> Pertanyaan Umum
          </h2>
          <p>Jawaban atas pertanyaan yang sering diajukan</p>
        </div>

        <div class={s.faqList}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              class={`${s.faqItem}${openIndex === i ? ` ${s.faqItemOpen}` : ''}`}
            >
              <button
                class={s.faqQuestion}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span>{faq.q}</span>
                <ChevronDown size={18} class={s.faqChevron} />
              </button>
              {openIndex === i && (
                <div class={s.faqAnswer}>
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== Contact ========== */
function ContactSection() {
  const ref = useScrollReveal();

  return (
    <section id="kontak" class={`section ${s.contact}`} ref={ref as never}>
      <div class="container">
        <div class="section-header">
          <h2>
            <Phone size={24} /> Hubungi Pengurus
          </h2>
          <p>Untuk informasi lebih lanjut, silakan hubungi pengurus masjid</p>
        </div>

        <div class={s.contactGrid}>
          <div class={s.contactCard}>
            <div class={s.contactCardIcon}>
              <Phone size={24} />
            </div>
            <h3 class={s.contactCardTitle}>Telepon</h3>
            <a href="tel:+6281234567890" class={s.contactCardValue}>0812-3456-7890</a>
          </div>

          <div class={s.contactCard}>
            <div class={s.contactCardIcon}>
              <MessageCircle size={24} />
            </div>
            <h3 class={s.contactCardTitle}>WhatsApp</h3>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" class={s.contactCardValue}>0812-3456-7890</a>
          </div>

          <div class={s.contactCard}>
            <div class={s.contactCardIcon}>
              <Mail size={24} />
            </div>
            <h3 class={s.contactCardTitle}>Email</h3>
            <a href="mailto:info@masjidalikhlas.id" class={s.contactCardValue}>info@masjidalikhlas.id</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== Helpers ========== */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
