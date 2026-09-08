'use server';

import { db } from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface FeeCategory {
  id: number;
  nama: string;
  nominal: number;
  keterangan: string;
}

export interface SetorRecord {
  id: number;
  tanggal: string;
  nominal: number;
  keterangan: string;
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
  feeCategories: FeeCategory[];
  santriFinances: SantriFinancial[];
  setorHistory: SetorRecord[];
}

interface FeeCategoryRow extends RowDataPacket {
  id: number;
  nama: string;
  nominal: number;
  keterangan: string;
}

interface SetorRow extends RowDataPacket {
  id: number;
  tanggal: string;
  nominal: number;
  keterangan: string;
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

export async function getKeuanganOverview(): Promise<KeuanganOverview> {
  try {
    // 1. Fee categories
    const [feeRows] = await db.query<FeeCategoryRow[]>(
      `SELECT 
        id, 
        name AS nama, 
        CAST(amount AS DOUBLE) AS nominal, 
        COALESCE(description, '') AS keterangan 
      FROM fee_categories 
      ORDER BY id ASC`
    );
    const feeCategories: FeeCategory[] = feeRows.map((r) => ({
      id: r.id,
      nama: r.nama,
      nominal: Number(r.nominal),
      keterangan: r.keterangan,
    }));

    // Total tanggungan per santri is sum of all fee category amounts
    const totalTanggungan = feeCategories.reduce((sum, f) => sum + f.nominal, 0);

    // 2. Santri list
    const [santriRows] = await db.query<SantriRow[]>(
      `SELECT id, name AS nama FROM santri WHERE isActive = 1 ORDER BY name ASC`
    );

    // 3. Payments
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

    // Group payments by santri
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
      return {
        id: s.id,
        nama: s.nama,
        totalTanggungan,
        totalDibayar,
        riwayat: history,
      };
    });

    // 4. Cash handouts (Setor Kas)
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

    const totalHandouts = setorHistory.reduce((sum, s) => sum + s.nominal, 0);
    const saldoDiTangan = Math.max(0, totalIncome - totalHandouts);

    return {
      saldoDiTangan,
      feeCategories,
      santriFinances,
      setorHistory,
    };
  } catch (error) {
    console.error('Error getting keuangan overview:', error);
    return {
      saldoDiTangan: 0,
      feeCategories: [],
      santriFinances: [],
      setorHistory: [],
    };
  }
}

export async function addFeeCategory(data: {
  nama: string;
  nominal: number;
  keterangan?: string;
}): Promise<{ success: boolean; data?: FeeCategory; error?: string }> {
  try {
    if (!data.nama || !data.nominal) {
      return { success: false, error: 'Nama dan nominal tagihan harus diisi' };
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO fee_categories (name, amount, description) VALUES (?, ?, ?)`,
      [data.nama.trim(), data.nominal, data.keterangan || '']
    );

    revalidatePath('/keuangan');
    return {
      success: true,
      data: {
        id: result.insertId,
        nama: data.nama.trim(),
        nominal: data.nominal,
        keterangan: data.keterangan || '',
      },
    };
  } catch (error) {
    console.error('Error adding fee category:', error);
    return { success: false, error: 'Gagal menambahkan tagihan di database' };
  }
}

export async function updateFeeCategory(
  id: number,
  data: { nama: string; nominal: number; keterangan?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id || !data.nama || !data.nominal) {
      return { success: false, error: 'Data tagihan tidak lengkap' };
    }

    await db.query(
      `UPDATE fee_categories SET name = ?, amount = ?, description = ? WHERE id = ?`,
      [data.nama.trim(), data.nominal, data.keterangan || '', id]
    );

    revalidatePath('/keuangan');
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

    revalidatePath('/keuangan');
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

    // Try finding matching fee category
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

    revalidatePath('/keuangan');
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

    revalidatePath('/keuangan');
    return { success: true };
  } catch (error) {
    console.error('Error adding cash handout:', error);
    return { success: false, error: 'Gagal mencatat setoran kas di database' };
  }
}
