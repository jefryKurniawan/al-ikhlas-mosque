import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import db, { pool } from './index.js';
import { users, zakatRecipients } from './schema.js';
import { generateId } from '../lib/auth.js';
import { hashPassword } from '../lib/password.js';
import { eq, sql } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  const conn = await pool.getConnection();

  try {
    // Check if data already exists (idempotent)
    const [existingTx] = await conn.execute('SELECT COUNT(*) as cnt FROM transactions');
    const txCount = (existingTx as unknown as Array<{ cnt: number }>)[0]?.cnt ?? 0;

    if (txCount > 0) {
      console.log(`Database already has ${txCount} transactions. Skipping seed data.`);
      console.log('Users will still be upserted...\n');
    }

    // ============================================================
    // 1. USERS — Admin accounts
    // ============================================================
    const adminId = generateId();
    const bendaharaId = generateId();
    // Fixed dev passwords (change in production!)
    const adminPassword = 'Admin1234';
    const bendaharaPassword = 'Bendahara1234';
    const adminHash = await hashPassword(adminPassword);
    const bendaharaHash = await hashPassword(bendaharaPassword);

    await db.insert(users).values([
      { id: adminId, username: 'admin', email: 'admin@masjidalikhlas.id', passwordHash: adminHash, provider: 'credentials', role: 'admin' },
    ]).onDuplicateKeyUpdate({ set: { passwordHash: adminHash } });

    await db.insert(users).values([
      { id: bendaharaId, username: 'bendahara', email: 'bendahara@masjidalikhlas.id', passwordHash: bendaharaHash, provider: 'credentials', role: 'admin' },
    ]).onDuplicateKeyUpdate({ set: { passwordHash: bendaharaHash } });
    console.log('Users seeded:');
    console.log('  admin     / Admin1234');
    console.log('  bendahara / Bendahara1234');

    // Skip transaction/activity/tier seed if data already exists
    if (txCount > 0) {
      console.log('\nSeed data already present. Only users were upserted.');
      return;
    }

    // ============================================================
    // 2. TRANSACTIONS — Jimpitan (bulanan per RT)
    // ============================================================
    const jimpitan: [string, number, string][] = [
      ['2026-01-15', 350000, 'Jimpitan RT 01 Januari'],
      ['2026-01-15', 275000, 'Jimpitan RT 02 Januari'],
      ['2026-01-15', 420000, 'Jimpitan RT 03 Januari'],
      ['2026-02-15', 365000, 'Jimpitan RT 01 Februari'],
      ['2026-02-15', 280000, 'Jimpitan RT 02 Februari'],
      ['2026-02-15', 410000, 'Jimpitan RT 03 Februari'],
      ['2026-03-15', 370000, 'Jimpitan RT 01 Maret'],
      ['2026-03-15', 290000, 'Jimpitan RT 02 Maret'],
      ['2026-03-15', 430000, 'Jimpitan RT 03 Maret'],
      ['2026-04-15', 380000, 'Jimpitan RT 01 April'],
      ['2026-04-15', 295000, 'Jimpitan RT 02 April'],
      ['2026-04-15', 440000, 'Jimpitan RT 03 April'],
      ['2026-05-15', 390000, 'Jimpitan RT 01 Mei'],
      ['2026-05-15', 300000, 'Jimpitan RT 02 Mei'],
      ['2026-05-15', 450000, 'Jimpitan RT 03 Mei'],
      ['2026-06-01', 355000, 'Jimpitan RT 01 Juni'],
      ['2026-06-01', 285000, 'Jimpitan RT 02 Juni'],
      ['2026-06-01', 435000, 'Jimpitan RT 03 Juni'],
    ];

    for (const [date, amount, description] of jimpitan) {
      await conn.execute(
        'INSERT INTO transactions (type, amount, date, description) VALUES (?, ?, ?, ?)',
        ['jimpitan', amount, date, description]
      );
    }
    console.log(`Jimpitan: ${jimpitan.length} records`);

    // ============================================================
    // 3. TRANSACTIONS — Hibah
    // ============================================================
    const hibah: [string, number, string, string][] = [
      ['2026-01-10', 5000000, 'Hibah renovasi masjid', 'Bpk. Suharto'],
      ['2026-02-20', 2500000, 'Hibah umum', 'Ibu Ratna Dewi'],
      ['2026-03-05', 10000000, 'Hibah dari perusahaan', 'PT. Sejahtera Abadi'],
      ['2026-04-15', 3000000, 'Hibah untuk anak yatim', 'Bpk. Agus Widodo'],
      ['2026-05-01', 7500000, 'Hibah keluarga', 'Keluarga Bpk. Rahmat'],
      ['2026-06-05', 4000000, 'Hibah untuk renovasi tempat wudhu', 'Bpk. Haryanto'],
    ];

    for (const [date, amount, description, donorName] of hibah) {
      await conn.execute(
        'INSERT INTO transactions (type, amount, date, description, donor_name) VALUES (?, ?, ?, ?, ?)',
        ['hibah', amount, date, description, donorName]
      );
    }
    console.log(`Hibah: ${hibah.length} records`);

    // ============================================================
    // 4. TRANSACTIONS — Zakat
    // ============================================================
    const zakat: [string, number, string, string][] = [
      ['2026-03-25', 3500000, 'Zakat Fitrah Keluarga', 'Ahmad Karim'],
      ['2026-03-26', 2000000, 'Zakat Fitrah', 'Siti Aminah'],
      ['2026-03-27', 4500000, 'Zakat Mal', 'Hadi Prasetyo'],
      ['2026-03-28', 1500000, 'Zakat Fitrah Keluarga', 'Darto Susilo'],
      ['2026-03-29', 8000000, 'Zakat Mal', 'Lestari Wulandari'],
      ['2026-03-30', 2500000, 'Zakat Fitrah', 'Wahyu Nugroho'],
      ['2026-04-01', 6000000, 'Zakat Mal dari Pengusaha', 'CV. Berkah Jaya'],
    ];

    for (const [date, amount, description, donorName] of zakat) {
      await conn.execute(
        'INSERT INTO transactions (type, amount, date, description, donor_name) VALUES (?, ?, ?, ?, ?)',
        ['zakat', amount, date, description, donorName]
      );
    }
    console.log(`Zakat: ${zakat.length} records`);

    // ============================================================
    // 5. TRANSACTIONS — Sedekah
    // ============================================================
    const sedekah: [string, number, string, string | null][] = [
      ['2026-01-05', 250000, 'Sedekah Jumat', null],
      ['2026-01-12', 175000, 'Sedekah Jumat', null],
      ['2026-01-19', 300000, 'Sedekah Jumat', null],
      ['2026-01-26', 200000, 'Sedekah Jumat', null],
      ['2026-02-02', 225000, 'Sedekah Jumat', null],
      ['2026-02-09', 280000, 'Sedekah Jumat', null],
      ['2026-02-16', 350000, 'Sedekah Jumat', null],
      ['2026-02-23', 190000, 'Sedekah Jumat', null],
      ['2026-03-01', 500000, 'Sedekah Jamaah Tabligh', 'Hamba Allah'],
      ['2026-03-15', 1500000, 'Sedekah Anak Yatim', 'Hamba Allah'],
      ['2026-04-10', 750000, 'Sedekah Ramadhan', null],
      ['2026-04-17', 1200000, 'Sedekah Ramadhan', null],
      ['2026-05-05', 400000, 'Sedekah Jumat', null],
      ['2026-06-01', 320000, 'Sedekah Jumat', null],
      ['2026-06-01', 500000, 'Sedekah umum', 'Hamba Allah'],
    ];

    for (const [date, amount, description, donorName] of sedekah) {
      await conn.execute(
        'INSERT INTO transactions (type, amount, date, description, donor_name) VALUES (?, ?, ?, ?, ?)',
        ['sedekah', amount, date, description, donorName]
      );
    }
    console.log(`Sedekah: ${sedekah.length} records`);

    // ============================================================
    // 6. TRANSACTIONS — Pengeluaran (per kategori)
    // ============================================================
    const pengeluaran: [string, number, string, string][] = [
      ['2026-01-05', 500000, 'Pembelian ATK masjid', 'operasional'],
      ['2026-01-10', 1200000, 'Bayar listrik Desember', 'operasional'],
      ['2026-01-20', 350000, 'Perbaikan speaker masjid', 'perawatan'],
      ['2026-02-01', 750000, 'Bantuan keluarga kurang mampu', 'sosial'],
      ['2026-02-10', 1200000, 'Bayar listrik Januari', 'operasional'],
      ['2026-02-15', 2000000, 'Perbaikan atap masjid', 'perawatan'],
      ['2026-03-01', 500000, 'Bantuan bencana alam', 'sosial'],
      ['2026-03-10', 1250000, 'Bayar listrik Februari', 'operasional'],
      ['2026-03-20', 800000, 'Pembelian karpet sholat', 'perawatan'],
      ['2026-04-01', 1500000, 'Persiapan buka puasa bersama', 'sosial'],
      ['2026-04-10', 1300000, 'Bayar listrik Maret', 'operasional'],
      ['2026-04-25', 3500000, 'THR marbot & imam', 'operasional'],
      ['2026-05-01', 600000, 'Distribusi zakat fakir miskin', 'sosial'],
      ['2026-05-10', 1300000, 'Bayar listrik April', 'operasional'],
      ['2026-05-15', 1500000, 'Servis kipas angin masjid', 'perawatan'],
      ['2026-06-01', 1350000, 'Bayar listrik Mei', 'operasional'],
      ['2026-06-01', 400000, 'Bantuan fakir miskin dusun', 'sosial'],
    ];

    for (const [date, amount, description, category] of pengeluaran) {
      await conn.execute(
        'INSERT INTO transactions (type, amount, date, description, category) VALUES (?, ?, ?, ?, ?)',
        ['pengeluaran', amount, date, description, category]
      );
    }
    console.log(`Pengeluaran: ${pengeluaran.length} records`);

    // ============================================================
    // 7. QURBAN TIERS — Paket qurban & sedekah
    // ============================================================
    const tiers: [string, number, string, string, number][] = [
      ['Sapi 1/7', 2500000, 'Paket 1/7 bagian sapi qurban. Termasuk distribusi daging ke mustahik.', 'https://images.unsplash.com/photo-1550640964-4939c20f4a95?w=600&h=400&fit=crop', 1],
      ['Sapi 1/1 (Utuh)', 17500000, 'Paket sapi qurban utuh. Cocok untuk kelompok/RT.', 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=600&h=400&fit=crop', 2],
      ['Kambing 1 Ekor', 2200000, 'Paket kambing qurban utuh.', 'https://images.unsplash.com/photo-1583337130417-13104dec14a2?w=600&h=400&fit=crop', 3],
      ['Domba 1 Ekor', 2800000, 'Paket domba premium qurban.', 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=600&h=400&fit=crop', 4],
      ['Sedekah Qurban', 500000, 'Sedekah untuk pelaksanaan qurban (distribusi, operasional).', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop', 5],
      ['Sedekah Yatim', 100000, 'Paket sedekah untuk anak yatim piatu.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop', 6],
      ['Sedekah Dhuafa', 150000, 'Paket sedekah untuk kaum dhuafa.', 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&h=400&fit=crop', 7],
      ['Paket Keluarga Qurban', 5000000, 'Paket qurban keluarga (1/7 sapi + sedekah yatim + sedekah dhuafa).', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=400&fit=crop', 8],
    ];

    for (const [name, amount, description, imageUrl, sortOrder] of tiers) {
      await conn.execute(
        'INSERT INTO qurban_tiers (name, amount, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?)',
        [name, amount, description, imageUrl, sortOrder]
      );
    }
    console.log(`Qurban tiers: ${tiers.length} records`);

    // ============================================================
    // 8. ACTIVITIES — Kegiatan masjid
    // ============================================================
    const activitiesData: [string, string, string, string, string, string, boolean][] = [
      ['Pengajian Selapanan Ahad Kliwonan', '2026-06-08', '20:00', 'besar', 'Pengajian umum tingkat dusun dengan penceramah dari luar desa. Silaturahmi warga se-Poncol.', '', true],
      ['TPQ Al-Ikhlas (Anak-anak)', '2026-06-01', '15:30', 'rutin', 'Belajar mengaji untuk anak-anak dukuh setiap sore Senin-Jumat. Terbuka untuk usia 4-12 tahun.', '', true],
      ['Santunan Anak Yatim & Dhuafa', '2026-06-20', '09:00', 'besar', 'Penyaluran dana santunan dari kas sedekah masjid untuk warga dukuh yang membutuhkan.', '', true],
      ['Megengan Menjelang Ramadhan', '2026-06-25', '19:00', 'besar', 'Kenduri doa bersama warga membawa ambengan (makanan) untuk menyambut bulan puasa.', '', true],
      ['Kerja Bakti Bersih Masjid', '2026-06-15', '07:00', 'rutin', 'Gotong royong warga membersihkan masjid, tempat wudhu, dan area sekitar. Setiap Ahad pagi.', '', true],
      ['Takbiran Keliling Dusun', '2026-06-26', '19:30', 'besar', 'Takbiran keliling dusun dengan obor dan pengeras suara menyambut Hari Raya Idul Fitri.', '', true],
      ['Kurban Idul Adha 1447 H', '2026-06-17', '07:00', 'besar', 'Pelaksanaan kurban. Kerja bakti penyembelihan dan pendistribusian daging ke seluruh KK di dukuh.', '', true],
      ['Rapat Pengurus & Tokoh RT', '2026-06-01', '20:00', 'rutin', 'Musyawarah bulanan evaluasi kas masjid, laporan jimpitan, dan rencana kegiatan.', '', false],
    ];

    for (const [title, eventDate, eventTime, category, description, imageUrl, isActive] of activitiesData) {
      await conn.execute(
        'INSERT INTO activities (title, event_date, event_time, category, description, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, eventDate, eventTime, category, description, imageUrl, isActive]
      );
    }
    console.log(`Activities: ${activitiesData.length} records`);

    // ============================================================
    // Summary
    // ============================================================
    const totalTx = jimpitan.length + hibah.length + zakat.length + sedekah.length + pengeluaran.length;
    // ============================================================
    // 6. ZAKAT RECIPIENTS — Penerima zakat (internal only)
    // ============================================================
    const [existingRecipients] = await conn.execute('SELECT COUNT(*) as cnt FROM zakat_recipients');
    const recipientCount = (existingRecipients as unknown as Array<{ cnt: number }>)[0]?.cnt ?? 0;

    if (recipientCount === 0) {
      const recipientsData: Array<{ name: string; address: string; category: string; amount: number; date: string; description: string }> = [
        { name: 'Ibu Sutinem', address: 'RT 01, Dukuh Krajan', category: 'fakir', amount: 500000, date: '2026-01-15', description: 'Janda lanjut usia, tidak memiliki penghasilan' },
        { name: 'Bpk. Kasmin', address: 'RT 02, Dukuh Krajan', category: 'fakir', amount: 500000, date: '2026-01-15', description: 'Tidak mampu bekerja karena sakit kronis' },
        { name: 'Ibu Rumiyati', address: 'RT 01, Dukuh Krajan', category: 'miskin', amount: 400000, date: '2026-02-10', description: 'Penghasilan tidak tetap, memiliki 3 anak kecil' },
        { name: 'Bpk. Suharto', address: 'RT 03, Dukuh Krajan', category: 'miskin', amount: 400000, date: '2026-02-10', description: 'Buruh tani dengan penghasilan minim' },
        { name: 'Bpk. Ahmad Fauzi', address: 'RT 02, Dukuh Krajan', category: 'mualaf', amount: 600000, date: '2026-03-01', description: 'Baru masuk Islam, masih belajar' },
        { name: 'Ibu Siti Aminah', address: 'RT 01, Dukuh Krajan', category: 'gharim', amount: 750000, date: '2026-04-10', description: 'Memiliki hutang biaya rumah sakit' },
        { name: 'Bpk. Wakidi', address: 'RT 03, Dukuh Krajan', category: 'fisabilillah', amount: 500000, date: '2026-04-15', description: 'Guru mengaji di TPQ masjid' },
        { name: 'Bpk. Kardi', address: 'RT 02, Dukuh Krajan', category: 'ibnu_sabil', amount: 300000, date: '2026-05-01', description: 'Musafir dalam perjalanan, kehabisan bekal' },
      ];

      for (const r of recipientsData) {
        await db.insert(zakatRecipients).values({
          name: r.name,
          address: r.address,
          category: r.category,
          amount: r.amount,
          date: new Date(r.date),
          description: r.description,
        });
      }
      console.log(`Zakat Recipients: ${recipientsData.length} penerima`);
    } else {
      console.log(`Zakat Recipients: already has ${recipientCount} records, skipping.`);
    }

    console.log('\n=== Seed Summary ===');
    console.log('Users: 2 (admin, bendahara)');
    console.log(`Transactions: ${totalTx} total`);
    console.log(`  - Jimpitan: ${jimpitan.length} (Jan-Mei, 3 RT)`);
    console.log(`  - Hibah: ${hibah.length}`);
    console.log(`  - Zakat: ${zakat.length} (Ramadhan season)`);
    console.log(`  - Sedekah: ${sedekah.length} (Jumat + Ramadhan)`);
    console.log(`  - Pengeluaran: ${pengeluaran.length} (operasional, perawatan, sosial)`);
    console.log(`Qurban Tiers: ${tiers.length} (sapi, kambing, domba, sedekah)`);
    console.log(`Activities: ${activitiesData.length} (7 aktif, 1 nonaktif)`);
    console.log('====================');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
