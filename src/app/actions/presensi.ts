'use server';

import { db } from '@/app/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath } from 'next/cache';

export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';

export interface AttendanceRecordItem {
  id: number;
  santriId: number;
  santriNama: string;
  date: string;
  status: AttendanceStatus;
  keterangan: string;
  commitStatus: 'DRAFT' | 'FINAL';
}

interface AttendanceRow extends RowDataPacket {
  id: number;
  santriId: number;
  santriNama: string;
  date: string;
  status: AttendanceStatus;
  keterangan: string;
  commitStatus: 'DRAFT' | 'FINAL';
}

interface MonthlySummaryRow extends RowDataPacket {
  id: number;
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalRecordedDays: number;
}

export interface MonthlySantriRekap {
  id: number;
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalRecordedDays: number;
  percentage: number;
}

export interface SantriAttendanceLog {
  id: number;
  santriId: number;
  date: string;
  status: AttendanceStatus;
  keterangan: string;
}

export async function getAttendanceRecordsByDate(date: string): Promise<AttendanceRecordItem[]> {
  try {
    const [rows] = await db.query<AttendanceRow[]>(
      `SELECT 
        a.id, 
        a.santriId, 
        s.name AS santriNama, 
        DATE_FORMAT(a.date, '%Y-%m-%d') AS date, 
        a.status, 
        COALESCE(a.notes, '') AS keterangan, 
        a.commitStatus 
      FROM attendances a 
      JOIN santri s ON s.id = a.santriId 
      WHERE DATE_FORMAT(a.date, '%Y-%m-%d') = ?`,
      [date]
    );

    return rows || [];
  } catch (error) {
    console.error('Error getting attendance records by date:', error);
    return [];
  }
}

export async function saveAttendanceRecords(
  date: string,
  records: Array<{
    santriId: number;
    status: AttendanceStatus;
    keterangan?: string;
  }>,
  isDraft: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!date || records.length === 0) {
      return { success: true };
    }

    const commitStatus = isDraft ? 'DRAFT' : 'FINAL';

    // Execute batch upsert
    for (const record of records) {
      await db.query(
        `INSERT INTO attendances (santriId, date, status, notes, commitStatus) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           status = VALUES(status), 
           notes = VALUES(notes), 
           commitStatus = VALUES(commitStatus)`,
        [
          record.santriId,
          date,
          record.status,
          record.keterangan || '',
          commitStatus,
        ]
      );
    }

    revalidatePath('/presensi');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error saving attendance records:', error);
    return { success: false, error: 'Gagal menyimpan presensi ke database' };
  }
}

export async function getMonthlyAttendanceSummary(
  month: string
): Promise<MonthlySantriRekap[]> {
  try {
    const [rows] = await db.query<MonthlySummaryRow[]>(
      `SELECT 
        s.id, 
        s.name AS nama, 
        CAST(COALESCE(SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS hadir, 
        CAST(COALESCE(SUM(CASE WHEN a.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS sakit, 
        CAST(COALESCE(SUM(CASE WHEN a.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS izin, 
        CAST(COALESCE(SUM(CASE WHEN a.status = 'ALPA' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS alpa, 
        CAST(COALESCE(COUNT(a.id), 0) AS UNSIGNED) AS totalRecordedDays 
      FROM santri s 
      LEFT JOIN attendances a ON a.santriId = s.id AND DATE_FORMAT(a.date, '%Y-%m') = ? 
      WHERE s.isActive = 1 
      GROUP BY s.id, s.name 
      ORDER BY s.name ASC`,
      [month]
    );

    return (rows || []).map((row) => {
      const total = Number(row.totalRecordedDays);
      const hadir = Number(row.hadir);
      return {
        id: row.id,
        nama: row.nama,
        hadir,
        sakit: Number(row.sakit),
        izin: Number(row.izin),
        alpa: Number(row.alpa),
        totalRecordedDays: total,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0,
      };
    });
  } catch (error) {
    console.error('Error getting monthly attendance summary:', error);
    return [];
  }
}

export async function getSantriAttendanceHistory(
  santriId: number,
  month?: string
): Promise<SantriAttendanceLog[]> {
  try {
    let query = `
      SELECT 
        id, 
        santriId, 
        DATE_FORMAT(date, '%Y-%m-%d') AS date, 
        status, 
        COALESCE(notes, '') AS keterangan 
      FROM attendances 
      WHERE santriId = ?`;
    const params: (number | string)[] = [santriId];

    if (month) {
      query += ` AND DATE_FORMAT(date, '%Y-%m') = ?`;
      params.push(month);
    }

    query += ` ORDER BY date DESC`;

    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return (rows as SantriAttendanceLog[]) || [];
  } catch (error) {
    console.error('Error getting santri attendance history:', error);
    return [];
  }
}

export async function getTodayAttendanceStats(): Promise<{
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        CAST(COALESCE(SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS hadir, 
        CAST(COALESCE(SUM(CASE WHEN status = 'IZIN' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS izin, 
        CAST(COALESCE(SUM(CASE WHEN status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS sakit, 
        CAST(COALESCE(SUM(CASE WHEN status = 'ALPA' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS alpa 
      FROM attendances 
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = ?`,
      [today]
    );

    if (rows && rows.length > 0) {
      return {
        hadir: Number(rows[0].hadir) || 0,
        izin: Number(rows[0].izin) || 0,
        sakit: Number(rows[0].sakit) || 0,
        alpa: Number(rows[0].alpa) || 0,
      };
    }
  } catch (error) {
    console.error('Error getting today attendance stats:', error);
  }

  return { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
}
