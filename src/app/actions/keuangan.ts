'use server';

import { db } from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface FeeCategory {
  id: number;
  nama: string;
  nominal: number;
  keterangan: string;
  santriIds: number[];
  untukSemua: boolean;
}

export interface SetorRecord {
  id: number;
  tanggal: string;
  nominal: number;
  keterangan: string;
}

export interface LoanRecord {
  id: number;
  tanggal: string;
  nominal: number;
  peminjam: string;
  keterangan: string;
  dikembalikan: number;
  sisa: number;
}

export interface PaymentItem {
  id: number;
  tanggal: string;
  nominal: number;
  jenis: string;
}

export interface SantriFinancial {
  id: number;
  nama: string;
  totalTanggungan: number;
  totalDibayar: number;
  riwayat: PaymentItem[];
}

export interface KeuanganOverview {
  saldoDiTangan: number;
  saldoSeharusnya: number;
  uangDipinjam: number;
  feeCategories: FeeCategory[];
  santriFinances: SantriFinancial[];
  setorHistory: SetorRecord[];
  loanHistory: LoanRecord[];
}

interface FeeCategoryRow extends RowDataPacket {
  id: number;
  nama: string;
  nominal: number;
  keterangan: string;
}

interface FeeAssignmentRow extends RowDataPacket {
  feeCategoryId: number;
  santriId: number;
}

interface SetorRow extends RowDataPacket {
  id: number;
  tanggal: string;
  nominal: number;
  keterangan: string;
}

interface LoanRow extends RowDataPacket {
  id: number;
  tanggal: string;
  nominal: number;
  peminjam: string;
  keterangan: string;
  dikembalikan: number;
}

interface PaymentRow extends RowDataPacket {
  id: number;
  santriId: number;
  tanggal: string;
  nominal: number;
  jenis: string;
}

interface SantriRow extends RowDataPacket {
  id: number;
  nama: string;
}

async function ensureExtraTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`cash_loans\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`amount\` DECIMAL(12, 2) NOT NULL,
      \`loanDate\` DATE NOT NULL,
      \`borrower\` VARCHAR(100) NOT NULL,
      \`description\` VARCHAR(255) NULL,
      \`repaidAmount\` DECIMAL(12, 2) NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`fee_category_santri\` (
      \`feeCategoryId\` INT NOT NULL,
      \`santriId\` INT NOT NULL,
      PRIMARY KEY (\`feeCategoryId\`, \`santriId\`),
      CONSTRAINT \`fk_fcs_fee\` FOREIGN KEY (\`feeCategoryId\`) REFERENCES \`fee_categories\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_fcs_santri\` FOREIGN KEY (\`santriId\`) REFERENCES \`santri\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function revalidateKeuangan() {
  revalidatePath('/keuangan');
  revalidatePath('/');
}

async function saveFeeAssignments(feeId: number, santriIds: number[], untukSemua: boolean) {
  await db.query('DELETE FROM fee_category_santri WHERE feeCategoryId = ?', [feeId]);
  if (untukSemua || santriIds.length === 0) return;

  const uniqueIds = [...new Set(santriIds)];
  for (const santriId of uniqueIds) {
    await db.query(
      'INSERT INTO fee_category_santri (feeCategoryId, santriId) VALUES (?, ?)',
      [feeId, santriId]
    );
  }
}

export async function getKeuanganOverview(): Promise<KeuanganOverview> {
  const empty: KeuanganOverview = {
    saldoDiTangan: 0,
    saldoSeharusnya: 0,
    uangDipinjam: 0,
    feeCategories: [],
    santriFinances: [],
    setorHistory: [],
    loanHistory: [],
  };

  try {
    await ensureExtraTables();

    const [feeRows] = await db.query<FeeCategoryRow[]>(
      `SELECT 
        id, 
        name AS nama, 
        CAST(amount AS DOUBLE) AS nominal, 
        COALESCE(description, '') AS keterangan 
      FROM fee_categories 
      ORDER BY id ASC`
    );

    const [assignmentRows] = await db.query<FeeAssignmentRow[]>(
      'SELECT feeCategoryId, santriId FROM fee_category_santri'
    );

    const assignmentsByFee = new Map<number, number[]>();
    for (const row of assignmentRows) {
      const list = assignmentsByFee.get(row.feeCategoryId) || [];
      list.push(row.santriId);
      assignmentsByFee.set(row.feeCategoryId, list);
    }

    const feeCategories: FeeCategory[] = feeRows.map((r) => {
      const santriIds = assignmentsByFee.get(r.id) || [];
      return {
        id: r.id,
        nama: r.nama,
        nominal: Number(r.nominal),
        keterangan: r.keterangan,
        santriIds,
        untukSemua: santriIds.length === 0,
      };
    });

    const [santriRows] = await db.query<SantriRow[]>(
      `SELECT id, name AS nama FROM santri WHERE isActive = 1 ORDER BY name ASC`
    );

    const [paymentRows] = await db.query<PaymentRow[]>(
      `SELECT 
        id, 
        santriId, 
        DATE_FORMAT(paymentDate, '%Y-%m-%d') AS tanggal, 
        CAST(amount AS DOUBLE) AS nominal, 
        COALESCE(jenis, notes, 'Pembayaran') AS jenis 
      FROM payments 
      ORDER BY paymentDate DESC, id DESC`
    );

    const paymentsBySantri = new Map<number, PaymentItem[]>();
    let totalIncome = 0;

    for (const p of paymentRows) {
      const nominal = Number(p.nominal);
      totalIncome += nominal;

      const items = paymentsBySantri.get(p.santriId) || [];
      items.push({
        id: p.id,
        tanggal: p.tanggal,
        nominal,
        jenis: p.jenis,
      });
      paymentsBySantri.set(p.santriId, items);
    }

    const santriFinances: SantriFinancial[] = santriRows.map((s) => {
      const history = paymentsBySantri.get(s.id) || [];
      const totalDibayar = history.reduce((sum, item) => sum + item.nominal, 0);
      const totalTanggungan = feeCategories.reduce((sum, fee) => {
        if (fee.untukSemua || fee.santriIds.includes(s.id)) {
          return sum + fee.nominal;
        }
        return sum;
      }, 0);

      return {
        id: s.id,
        nama: s.nama,
        totalTanggungan,
        totalDibayar,
        riwayat: history,
      };
    });

    const [setorRows] = await db.query<SetorRow[]>(
      `SELECT 
        id, 
        DATE_FORMAT(depositDate, '%Y-%m-%d') AS tanggal, 
        CAST(amount AS DOUBLE) AS nominal, 
        description AS keterangan 
      FROM cash_handouts 
      ORDER BY depositDate DESC, id DESC`
    );

    const setorHistory: SetorRecord[] = setorRows.map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      nominal: Number(r.nominal),
      keterangan: r.keterangan,
    }));

    const [loanRows] = await db.query<LoanRow[]>(
      `SELECT 
        id,
        DATE_FORMAT(loanDate, '%Y-%m-%d') AS tanggal,
        CAST(amount AS DOUBLE) AS nominal,
        borrower AS peminjam,
        COALESCE(description, '') AS keterangan,
        CAST(repaidAmount AS DOUBLE) AS dikembalikan
      FROM cash_loans
      ORDER BY loanDate DESC, id DESC`
    );

    const loanHistory: LoanRecord[] = loanRows.map((r) => {
      const nominal = Number(r.nominal);
      const dikembalikan = Number(r.dikembalikan);
      return {
        id: r.id,
        tanggal: r.tanggal,
        nominal,
        peminjam: r.peminjam,
        keterangan: r.keterangan,
        dikembalikan,
        sisa: Math.max(0, nominal - dikembalikan),
      };
    });

    const totalHandouts = setorHistory.reduce((sum, s) => sum + s.nominal, 0);
    const uangDipinjam = loanHistory.reduce((sum, l) => sum + l.sisa, 0);
    const saldoSeharusnya = Math.max(0, totalIncome - totalHandouts);
    const saldoDiTangan = Math.max(0, saldoSeharusnya - uangDipinjam);

    return {
      saldoDiTangan,
      saldoSeharusnya,
      uangDipinjam,
      feeCategories,
      santriFinances,
      setorHistory,
      loanHistory,
    };
  } catch (error) {
    console.error('Error getting keuangan overview:', error);
    return empty;
  }
}

export async function addFeeCategory(data: {
  nama: string;
  nominal: number;
  keterangan?: string;
  santriIds?: number[];
  untukSemua?: boolean;
}): Promise<{ success: boolean; data?: FeeCategory; error?: string }> {
  try {
    await ensureExtraTables();

    if (!data.nama || !data.nominal) {
      return { success: false, error: 'Nama dan nominal tagihan harus diisi' };
    }

    const untukSemua = data.untukSemua !== false;
    if (!untukSemua && (!data.santriIds || data.santriIds.length === 0)) {
      return { success: false, error: 'Pilih minimal satu santri untuk tagihan ini' };
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO fee_categories (name, amount, description) VALUES (?, ?, ?)`,
      [data.nama.trim(), data.nominal, data.keterangan || '']
    );

    await saveFeeAssignments(result.insertId, data.santriIds || [], untukSemua);

    revalidateKeuangan();
    return {
      success: true,
      data: {
        id: result.insertId,
        nama: data.nama.trim(),
        nominal: data.nominal,
        keterangan: data.keterangan || '',
        santriIds: untukSemua ? [] : data.santriIds || [],
        untukSemua,
      },
    };
  } catch (error) {
    console.error('Error adding fee category:', error);
    return { success: false, error: 'Gagal menambahkan tagihan di database' };
  }
}

export async function updateFeeCategory(
  id: number,
  data: {
    nama: string;
    nominal: number;
    keterangan?: string;
    santriIds?: number[];
    untukSemua?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureExtraTables();

    if (!id || !data.nama || !data.nominal) {
      return { success: false, error: 'Data tagihan tidak lengkap' };
    }

    const untukSemua = data.untukSemua !== false;
    if (!untukSemua && (!data.santriIds || data.santriIds.length === 0)) {
      return { success: false, error: 'Pilih minimal satu santri untuk tagihan ini' };
    }

    await db.query(
      `UPDATE fee_categories SET name = ?, amount = ?, description = ? WHERE id = ?`,
      [data.nama.trim(), data.nominal, data.keterangan || '', id]
    );

    await saveFeeAssignments(id, data.santriIds || [], untukSemua);

    revalidateKeuangan();
    return { success: true };
  } catch (error) {
    console.error('Error updating fee category:', error);
    return { success: false, error: 'Gagal memperbarui tagihan di database' };
  }
}

export async function deleteFeeCategory(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: 'ID tagihan tidak valid' };

    await db.query('DELETE FROM fee_categories WHERE id = ?', [id]);

    revalidateKeuangan();
    return { success: true };
  } catch (error) {
    console.error('Error deleting fee category:', error);
    return { success: false, error: 'Gagal menghapus tagihan di database' };
  }
}

export async function addPayment(data: {
  santriId: number;
  tanggal: string;
  nominal: number;
  jenis: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.santriId || !data.nominal || data.nominal <= 0) {
      return { success: false, error: 'Santri dan nominal valid harus diisi' };
    }

    const [matchingFee] = await db.query<RowDataPacket[]>(
      'SELECT id FROM fee_categories WHERE name = ? LIMIT 1',
      [data.jenis]
    );
    const feeCategoryId = matchingFee && matchingFee.length > 0 ? matchingFee[0].id : null;

    await db.query(
      `INSERT INTO payments (santriId, feeCategoryId, amount, jenis, paymentDate, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.santriId,
        feeCategoryId,
        data.nominal,
        data.jenis,
        data.tanggal || new Date().toISOString().split('T')[0],
        data.jenis,
      ]
    );

    revalidateKeuangan();
    return { success: true };
  } catch (error) {
    console.error('Error adding payment:', error);
    return { success: false, error: 'Gagal menyimpan pembayaran di database' };
  }
}

export async function addCashHandout(data: {
  tanggal: string;
  nominal: number;
  keterangan: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.nominal || data.nominal <= 0) {
      return { success: false, error: 'Nominal setoran harus lebih dari 0' };
    }

    await db.query(
      `INSERT INTO cash_handouts (amount, depositDate, description, ustadzId) 
       VALUES (?, ?, ?, 1)`,
      [
        data.nominal,
        data.tanggal || new Date().toISOString().split('T')[0],
        data.keterangan || 'Setor Kas Tunai',
      ]
    );

    revalidateKeuangan();
    return { success: true };
  } catch (error) {
    console.error('Error adding cash handout:', error);
    return { success: false, error: 'Gagal mencatat setoran kas di database' };
  }
}

export async function addCashLoan(data: {
  tanggal: string;
  nominal: number;
  peminjam: string;
  keterangan?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureExtraTables();

    if (!data.peminjam?.trim()) {
      return { success: false, error: 'Nama peminjam harus diisi' };
    }
    if (!data.nominal || data.nominal <= 0) {
      return { success: false, error: 'Nominal pinjaman harus lebih dari 0' };
    }

    await db.query(
      `INSERT INTO cash_loans (amount, loanDate, borrower, description, repaidAmount)
       VALUES (?, ?, ?, ?, 0)`,
      [
        data.nominal,
        data.tanggal || new Date().toISOString().split('T')[0],
        data.peminjam.trim(),
        data.keterangan || 'Pinjam kas tunai',
      ]
    );

    revalidateKeuangan();
    return { success: true };
  } catch (error) {
    console.error('Error adding cash loan:', error);
    return { success: false, error: 'Gagal mencatat pinjaman kas di database' };
  }
}

export async function repayCashLoan(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureExtraTables();
    if (!id) return { success: false, error: 'ID pinjaman tidak valid' };

    await db.query('UPDATE cash_loans SET repaidAmount = amount WHERE id = ?', [id]);

    revalidateKeuangan();
    return { success: true };
  } catch (error) {
    console.error('Error repaying cash loan:', error);
    return { success: false, error: 'Gagal mencatat pengembalian pinjaman' };
  }
}

export async function getSaldoDiTangan(): Promise<number> {
  try {
    await ensureExtraTables();

    const [incomeRows] = await db.query<RowDataPacket[]>(
      'SELECT CAST(COALESCE(SUM(amount), 0) AS DOUBLE) AS total FROM payments'
    );
    const [handoutRows] = await db.query<RowDataPacket[]>(
      'SELECT CAST(COALESCE(SUM(amount), 0) AS DOUBLE) AS total FROM cash_handouts'
    );
    const [loanRows] = await db.query<RowDataPacket[]>(
      'SELECT CAST(COALESCE(SUM(amount - repaidAmount), 0) AS DOUBLE) AS total FROM cash_loans'
    );

    const totalIncome = Number(incomeRows[0]?.total ?? 0);
    const totalHandouts = Number(handoutRows[0]?.total ?? 0);
    const uangDipinjam = Number(loanRows[0]?.total ?? 0);
    return Math.max(0, totalIncome - totalHandouts - uangDipinjam);
  } catch (error) {
    console.error('Error getting saldo di tangan:', error);
    return 0;
  }
}
