import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  Clock,
  CalendarDays,
  MapPin,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Download,
  Printer,
} from 'lucide-preact';
import { useApi } from '../hooks/useApi';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';
import { PrayerTimeCard } from '../components/PrayerTimeCard';
import type { PrayerTime, Activity, QurbanTier, ReportSummary, JimpitanReport, ZakatReport, RamadhanReport, QurbanReport } from '../../shared/types';
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
      <LaporanSection />
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
    const prayer = prayers[i];
    if (!prayer) continue;
    const parts = prayer.time.split(':');
    const h = Number(parts[0] ?? '0');
    const m = Number(parts[1] ?? '0');
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
function StatItem({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(end);

  return (
    <div class={s.aboutStat}>
      <span class={s.aboutStatNumber} ref={ref as never}>
        {count}{suffix}
      </span>
      <span class={s.aboutStatLabel}>{label}</span>
    </div>
  );
}

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
            <StatItem end={5} label="Waktu Sholat Berjamaah" />
            <StatItem end={8} suffix="+" label="Kegiatan Rutin" />
            <StatItem end={100} suffix="%" label="Transparansi Keuangan" />
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
            <CalendarDays size={24} /> Agenda Kegiatan
          </h2>
          <p>Kegiatan masjid dan warga dukuh Gonggang</p>
        </div>

        {loading && (
          <div class={s.loader}>
            <Loader2 size={24} class="spin" />
            <span>Memuat kegiatan...</span>
          </div>
        )}

        {activities && activities.length > 0 && (
          <div class={s.timeline}>
            {activities.map(a => (
              <div key={a.id} class={s.timelineItem}>
                <div class={s.timelineDot}>
                  <div class={s.timelineDotInner} />
                </div>
                <div class={s.timelineContent}>
                  <div class={s.timelineDate}>
                    <CalendarDays size={14} />
                    <span>{formatDate(a.eventDate)}</span>
                    {a.eventTime && <><Clock size={14} /> <span>{a.eventTime}</span></>}
                    <span class={a.category === 'rutin' ? s.badgeRutin : s.badgeBesar}>
                      {a.category === 'rutin' ? 'Rutin' : 'Besar'}
                    </span>
                  </div>
                  <h3 class={s.timelineTitle}>{a.title}</h3>
                  <p class={s.timelineDesc}>{a.description}</p>
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

/* ========== Laporan Keuangan ========== */
type ReportTab = 'bulanan' | 'jimpitan' | 'zakat' | 'ramadhan' | 'qurban';

const REPORT_TABS: { key: ReportTab; label: string }[] = [
  { key: 'bulanan', label: 'Ringkasan' },
  { key: 'jimpitan', label: 'Jimpitan' },
  { key: 'zakat', label: 'Zakat & Sedekah' },
  { key: 'ramadhan', label: 'Ramadhan' },
  { key: 'qurban', label: 'Qurban' },
];

function LaporanSection() {
  const ref = useScrollReveal();
  const [activeTab, setActiveTab] = useState<ReportTab>('bulanan');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Separate state for each report type
  const [bulananData, setBulananData] = useState<ReportSummary | null>(null);
  const [jimpitanData, setJimpitanData] = useState<JimpitanReport | null>(null);
  const [zakatData, setZakatData] = useState<ZakatReport | null>(null);
  const [ramadhanData, setRamadhanData] = useState<RamadhanReport | null>(null);
  const [qurbanData, setQurbanData] = useState<QurbanReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const fetchReport = async () => {
      try {
        if (activeTab === 'bulanan') {
          const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'bulanan', year, month }),
          });
          const json = await res.json();
          if (!cancelled && json.success) setBulananData(json.data);
        } else if (activeTab === 'jimpitan') {
          const params = new URLSearchParams({ year: String(year), month: String(month) });
          const res = await fetch(`/api/reports/jimpitan?${params}`);
          const json = await res.json();
          if (!cancelled && json.success) setJimpitanData(json.data);
        } else if (activeTab === 'zakat') {
          const res = await fetch(`/api/reports/zakat?year=${year}`);
          const json = await res.json();
          if (!cancelled && json.success) setZakatData(json.data);
        } else if (activeTab === 'ramadhan') {
          const res = await fetch(`/api/reports/ramadhan?year=${year}`);
          const json = await res.json();
          if (!cancelled && json.success) setRamadhanData(json.data);
        } else if (activeTab === 'qurban') {
          const res = await fetch(`/api/reports/qurban?year=${year}`);
          const json = await res.json();
          if (!cancelled && json.success) setQurbanData(json.data);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();
    return () => { cancelled = true; };
  }, [activeTab, year, month]);

  const handleDownloadCsv = () => {
    const urls: Record<ReportTab, string> = {
      bulanan: `/api/reports/csv`,
      jimpitan: `/api/reports/jimpitan/csv?year=${year}&month=${month}`,
      zakat: `/api/reports/zakat/csv?year=${year}`,
      ramadhan: `/api/reports/ramadhan/csv?year=${year}`,
      qurban: `/api/reports/qurban/csv?year=${year}`,
    };
    if (activeTab === 'bulanan') {
      // POST needed for bulanan CSV
      fetch('/api/reports/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bulanan', year, month }),
      })
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `laporan-bulanan-${year}-${String(month).padStart(2, '0')}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        });
    } else {
      window.open(urls[activeTab], '_blank');
    }
  };

  const handlePrint = () => {
    const urls: Record<ReportTab, string> = {
      bulanan: `/api/reports/pdf`,
      jimpitan: `/api/reports/jimpitan/html?year=${year}&month=${month}`,
      zakat: `/api/reports/zakat/html?year=${year}`,
      ramadhan: `/api/reports/ramadhan/html?year=${year}`,
      qurban: `/api/reports/qurban/html?year=${year}`,
    };
    if (activeTab === 'bulanan') {
      fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bulanan', year, month }),
      })
        .then(r => r.text())
        .then(html => {
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(html);
            w.document.close();
          }
        });
    } else {
      window.open(urls[activeTab], '_blank');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
  ];

  const showMonth = activeTab === 'bulanan' || activeTab === 'jimpitan';

  return (
    <section id="laporan" class={`section ${s.laporan}`} ref={ref as never}>
      <div class="container">
        <div class="section-header">
          <h2>
            <FileText size={24} /> Laporan Keuangan
          </h2>
          <p>Transparansi keuangan masjid untuk jamaah</p>
        </div>

        {/* Tabs */}
        <div class={s.reportTabs}>
          {REPORT_TABS.map(tab => (
            <button
              key={tab.key}
              class={`${s.reportTab}${activeTab === tab.key ? ` ${s.reportTabActive}` : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div class={s.reportFilters}>
          <select
            class={s.reportSelect}
            value={year}
            onChange={(e) => setYear(Number((e.target as HTMLSelectElement).value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {showMonth && (
            <select
              class={s.reportSelect}
              value={month}
              onChange={(e) => setMonth(Number((e.target as HTMLSelectElement).value))}
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div class={s.loader}>
            <Loader2 size={24} class="spin" />
            <span>Memuat laporan...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div class={s.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Content per tab */}
        {!loading && !error && (
          <div class={s.reportContent}>
            {activeTab === 'bulanan' && bulananData && <BulananReport data={bulananData} />}
            {activeTab === 'jimpitan' && jimpitanData && <JimpitanReportView data={jimpitanData} />}
            {activeTab === 'zakat' && zakatData && <ZakatReportView data={zakatData} />}
            {activeTab === 'ramadhan' && ramadhanData && <RamadhanReportView data={ramadhanData} />}
            {activeTab === 'qurban' && qurbanData && <QurbanReportView data={qurbanData} />}
          </div>
        )}

        {/* Download actions */}
        {!loading && !error && (
          <div class={s.reportActions}>
            <button class="btn btn-ghost" onClick={handleDownloadCsv}>
              <Download size={16} /> Unduh CSV
            </button>
            <button class="btn btn-ghost" onClick={handlePrint}>
              <Printer size={16} /> Cetak / PDF
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* Report sub-components */
function StatCard({ icon: Icon, label, value, variant = 'default' }: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  variant?: 'default' | 'in' | 'out' | 'saldo';
}) {
  return (
    <div class={s.reportStatCard}>
      <div class={`${s.reportStatIcon}${variant !== 'default' ? ` ${s[`reportStat${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}` : ''}`}>
        <Icon size={20} />
      </div>
      <div class={s.reportStatInfo}>
        <span class={s.reportStatLabel}>{label}</span>
        <span class={s.reportStatValue}>{value}</span>
      </div>
    </div>
  );
}

function BulananReport({ data }: { data: ReportSummary }) {
  const totalPemasukan = Object.values(data.pemasukan).reduce((a, b) => a + b, 0);
  return (
    <>
      <div class={s.reportStatsGrid}>
        <StatCard icon={TrendingUp} label="Total Pemasukan" value={formatCurrency(totalPemasukan)} variant="in" />
        <StatCard icon={TrendingDown} label="Total Pengeluaran" value={formatCurrency(data.pengeluaran)} variant="out" />
        <StatCard icon={Scale} label="Saldo" value={formatCurrency(data.saldo)} variant="saldo" />
      </div>
      <div class={s.reportBreakdown}>
        <div class={s.reportBreakdownCard}>
          <h4 class={s.reportBreakdownTitle}>Pemasukan per Jenis</h4>
          {(['jimpitan', 'hibah', 'zakat', 'sedekah'] as const).map(type => (
            <div key={type} class={s.reportBreakdownRow}>
              <span class={s.reportBreakdownLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              <span class={s.reportBreakdownAmount}>{formatCurrency(data.pemasukan[type] ?? 0)}</span>
            </div>
          ))}
        </div>
        <div class={s.reportBreakdownCard}>
          <h4 class={s.reportBreakdownTitle}>Pengeluaran per Kategori</h4>
          {(['operasional', 'perawatan', 'sosial'] as const).map(cat => (
            <div key={cat} class={s.reportBreakdownRow}>
              <span class={s.reportBreakdownLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span class={s.reportBreakdownAmount}>{formatCurrency(data.pengeluaranPerKategori[cat] ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function JimpitanReportView({ data }: { data: JimpitanReport }) {
  return (
    <>
      <div class={s.reportStatsGrid}>
        <StatCard icon={TrendingUp} label="Total Terkumpul" value={formatCurrency(data.totalKeseluruhan)} variant="in" />
        <StatCard icon={FileText} label="Jumlah RT" value={`${data.recapPerRT.length} RT`} />
      </div>
      {data.recapPerRT.length > 0 && (
        <div class={s.reportTableWrap}>
          <h4 class={s.reportTableTitle}>Rekap Per RT</h4>
          <table class={s.reportTable}>
            <thead>
              <tr><th>RT</th><th class={s.reportTableAmount}>Total</th></tr>
            </thead>
            <tbody>
              {data.recapPerRT.map(r => (
                <tr key={r.rt}>
                  <td>{r.rt}</td>
                  <td class={s.reportTableAmount}>{formatCurrency(r.total)}</td>
                </tr>
              ))}
              <tr class={s.reportTableTotal}>
                <td>Total</td>
                <td class={s.reportTableAmount}>{formatCurrency(data.totalKeseluruhan)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ZakatReportView({ data }: { data: ZakatReport }) {
  return (
    <div class={s.reportStatsGrid}>
      <StatCard icon={TrendingUp} label="Total Zakat" value={formatCurrency(data.totalZakat)} variant="in" />
      <StatCard icon={TrendingUp} label="Total Sedekah" value={formatCurrency(data.totalSedekah)} variant="in" />
      <StatCard icon={Scale} label="Total Keseluruhan" value={formatCurrency(data.totalKeseluruhan)} variant="saldo" />
    </div>
  );
}

function RamadhanReportView({ data }: { data: RamadhanReport }) {
  return (
    <>
      <div class={s.reportStatsGrid}>
        <StatCard icon={TrendingUp} label="Total Pemasukan" value={formatCurrency(data.totalPemasukan)} variant="in" />
        <StatCard icon={TrendingDown} label="Total Pengeluaran" value={formatCurrency(data.totalPengeluaran)} variant="out" />
        <StatCard icon={Scale} label="Saldo" value={formatCurrency(data.saldo)} variant="saldo" />
      </div>
      {data.pemasukanDetail.length > 0 && (
        <div class={s.reportTableWrap}>
          <h4 class={s.reportTableTitle}>Pemasukan per Jenis</h4>
          <table class={s.reportTable}>
            <thead>
              <tr><th>Jenis</th><th class={s.reportTableAmount}>Jumlah</th></tr>
            </thead>
            <tbody>
              {data.pemasukanDetail.map(d => (
                <tr key={d.type}>
                  <td>{d.type.charAt(0).toUpperCase() + d.type.slice(1)}</td>
                  <td class={s.reportTableAmount}>{formatCurrency(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function QurbanReportView({ data }: { data: QurbanReport }) {
  return (
    <>
      {data.tiers.length > 0 && (
        <div class={s.reportTableWrap}>
          <h4 class={s.reportTableTitle}>Paket Qurban</h4>
          <table class={s.reportTable}>
            <thead>
              <tr><th>Paket</th><th class={s.reportTableAmount}>Harga</th><th>Deskripsi</th></tr>
            </thead>
            <tbody>
              {data.tiers.map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td class={s.reportTableAmount}>{formatCurrency(t.amount)}</td>
                  <td>{t.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.totalOperasional > 0 && (
        <div class={s.reportStatsGrid}>
          <StatCard icon={TrendingDown} label="Dana Operasional Qurban" value={formatCurrency(data.totalOperasional)} variant="out" />
        </div>
      )}
    </>
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
