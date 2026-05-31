import 'dotenv/config';
import pool from './connection.js';
import { generateId } from '../lib/auth.js';
import { hashPassword } from '../lib/password.js';

async function seed() {
  console.log('Seeding database...');

  const conn = await pool.getConnection();

  try {
    // ============================================================
    // 1. USERS — Admin accounts
    // ============================================================
    const adminId = generateId();
    const bendaharaId = generateId();
    const passwordHash = await hashPassword('admin123');

    await conn.execute(
      `INSERT IGNORE INTO users (id, username, email, password_hash, provider, role)
       VALUES (?, ?, ?, ?, 'credentials', 'admin')`,
      [adminId, 'admin', 'admin@masjidalikhlas.id', passwordHash]
    );
    await conn.execute(
      `INSERT IGNORE INTO users (id, username, email, password_hash, provider, role)
       VALUES (?, ?, ?, ?, 'credentials', 'admin')`,
      [bendaharaId, 'bendahara', 'bendahara@masjidalikhlas.id', passwordHash]
    );
    console.log('Users: admin, bendahara (password: admin123)');

    // ============================================================
    // 2. TRANSACTIONS — Jimpitan (bulanan per RT)
    // ============================================================
    const jimpitan = [
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
    ] as const;

    for (const [date, amount, desc] of jimpitan) {
      await conn.execute(
        `INSERT INTO transactions (type, amount, date, description) VALUES ('jimpitan', ?, ?, ?)`,
        [amount, date, desc]
      );
    }
    console.log(`Jimpitan: ${jimpitan.length} records`);

    // ============================================================
    // 3. TRANSACTIONS — Hibah
    // ============================================================
    const hibah = [
      ['2026-01-10', 5000000, 'Hibah renovasi masjid', 'Bpk. Suharto'],
      ['2026-02-20', 2500000, 'Hibah umum', 'Ibu Ratna Dewi'],
      ['2026-03-05', 10000000, 'Hibah dari perusahaan', 'PT. Sejahtera Abadi'],
      ['2026-04-15', 3000000, 'Hibah untuk anak yatim', 'Bpk. Agus Widodo'],
      ['2026-05-01', 7500000, 'Hibah keluarga', 'Keluarga Bpk. Rahmat'],
    ] as const;

    for (const [date, amount, desc, donor] of hibah) {
      await conn.execute(
        `INSERT INTO transactions (type, amount, date, description, donor_name) VALUES ('hibah', ?, ?, ?, ?)`,
        [amount, date, desc, donor]
      );
    }
    console.log(`Hibah: ${hibah.length} records`);

    // ============================================================
    // 4. TRANSACTIONS — Zakat
    // ============================================================
    const zakat = [
      ['2026-03-25', 3500000, 'Zakat Fitrah Keluarga', 'Ahmad Karim', null],
      ['2026-03-26', 2000000, 'Zakat Fitrah', 'Siti Aminah', null],
      ['2026-03-27', 4500000, 'Zakat Mal', 'Hadi Prasetyo', null],
      ['2026-03-28', 1500000, 'Zakat Fitrah Keluarga', 'Darto Susilo', null],
      ['2026-03-29', 8000000, 'Zakat Mal', 'Lestari Wulandari', null],
      ['2026-03-30', 2500000, 'Zakat Fitrah', 'Wahyu Nugroho', null],
      ['2026-04-01', 6000000, 'Zakat Mal dari Pengusaha', 'CV. Berkah Jaya', null],
    ] as const;

    for (const [date, amount, desc, donor, cat] of zakat) {
      await conn.execute(
        `INSERT INTO transactions (type, amount, date, description, donor_name, category) VALUES ('zakat', ?, ?, ?, ?, ?)`,
        [amount, date, desc, donor, cat]
      );
    }
    console.log(`Zakat: ${zakat.length} records`);

    // ============================================================
    // 5. TRANSACTIONS — Sedekah
    // ============================================================
    const sedekah = [
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
    ] as const;

    for (const [date, amount, desc, donor] of sedekah) {
      await conn.execute(
        `INSERT INTO transactions (type, amount, date, description, donor_name) VALUES ('sedekah', ?, ?, ?, ?)`,
        [amount, date, desc, donor]
      );
    }
    console.log(`Sedekah: ${sedekah.length} records`);

    // ============================================================
    // 6. TRANSACTIONS — Pengeluaran (per kategori)
    // ============================================================
    const pengeluaran = [
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
      ['2026-05-15', 1500000, 'Servis AC masjid', 'perawatan'],
    ] as const;

    for (const [date, amount, desc, category] of pengeluaran) {
      await conn.execute(
        `INSERT INTO transactions (type, amount, date, description, category) VALUES ('pengeluaran', ?, ?, ?, ?)`,
        [amount, date, desc, category]
      );
    }
    console.log(`Pengeluaran: ${pengeluaran.length} records`);

    // ============================================================
    // 7. QURBAN TIERS — Paket qurban & sedekah
    // ============================================================
    const tiers = [
      ['Sapi 1/7', 2500000, 'Paket 1/7 bagian sapi qurban. Termasuk distribusi daging ke mustahik.', 1],
      ['Sapi 1/1 (Utuh)', 17500000, 'Paket sapi qurban utuh. Cocok untuk kelompok/RT.', 2],
      ['Kambing 1 Ekor', 2200000, 'Paket kambing qurban utuh.', 3],
      ['Domba 1 Ekor', 2800000, 'Paket domba premium qurban.', 4],
      ['Sedekah Qurban', 500000, 'Sedekah untuk pelaksanaan qurban (distribusi, operasional).', 5],
      ['Sedekah Yatim', 100000, 'Paket sedekah untuk anak yatim piatu.', 6],
      ['Sedekah Dhuafa', 150000, 'Paket sedekah untuk kaum dhuafa.', 7],
      ['Paket Keluarga Qurban', 5000000, 'Paket qurban keluarga (1/7 sapi + sedekah yatim + sedekah dhuafa).', 8],
    ] as const;

    for (const [name, amount, description, sort_order] of tiers) {
      await conn.execute(
        `INSERT INTO qurban_tiers (name, amount, description, sort_order) VALUES (?, ?, ?, ?)`,
        [name, amount, description, sort_order]
      );
    }
    console.log(`Qurban tiers: ${tiers.length} records`);

    // ============================================================
    // 8. ACTIVITIES — Kegiatan masjid
    // ============================================================
    const activities = [
      ['Sholat Jumat Berjamaah', '2026-06-05', 'Sholat Jumat dengan khotib undangan. Khotib: Ust. Ahmad Fauzi.', true],
      ['Pengajian Rutin Sabtu Malam', '2026-06-07', 'Pengajian rutin Sabtu malam minggu pertama. Kitab: Riyadhus Shalihin.', true],
      ['Buka Puasa Bersama', '2026-06-15', 'Buka puasa bersama warga RW 05. Kontribusi: nasi kotak.', true],
      ['Santunan Anak Yatim', '2026-06-20', 'Santunan untuk 25 anak yatim piatu di sekitar masjid.', true],
      ['Peringatan Isra Mi\'raj', '2026-07-01', 'Peringatan Isra Mi\'raj Nabi Muhammad SAW.', true],
      ['Tadarus Al-Quran', '2026-07-10', 'Kegiatan tadarus Al-Quran bersama setiap bulan.', true],
      ['Kurban Idul Adha 1447 H', '2026-06-17', 'Pelaksanaan kurban Idul Adha. Pendaftaran dibuka sampai 10 Juni.', true],
      ['Rapat Pengurus Bulanan', '2026-06-01', 'Rapat koordinasi pengurus masjid. Agenda: evaluasi keuangan.', false],
    ] as const;

    for (const [title, event_date, description, is_active] of activities) {
      await conn.execute(
        `INSERT INTO activities (title, event_date, description, is_active) VALUES (?, ?, ?, ?)`,
        [title, event_date, description, is_active]
      );
    }
    console.log(`Activities: ${activities.length} records`);

    // ============================================================
    // Summary
    // ============================================================
    const totalTx = jimpitan.length + hibah.length + zakat.length + sedekah.length + pengeluaran.length;
    console.log('\n=== Seed Summary ===');
    console.log('Users: 2 (admin, bendahara)');
    console.log(`Transactions: ${totalTx} total`);
    console.log(`  - Jimpitan: ${jimpitan.length} (Jan-Mei, 3 RT)`);
    console.log(`  - Hibah: ${hibah.length}`);
    console.log(`  - Zakat: ${zakat.length} (Ramadhan season)`);
    console.log(`  - Sedekah: ${sedekah.length} (Jumat + Ramadhan)`);
    console.log(`  - Pengeluaran: ${pengeluaran.length} (operasional, perawatan, sosial)`);
    console.log(`Qurban Tiers: ${tiers.length} (sapi, kambing, domba, sedekah)`);
    console.log(`Activities: ${activities.length} (7 aktif, 1 nonaktif)`);
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
