import React from 'react';

const SlipGajiTemplate = ({ selectedSlip }) => {
  if (!selectedSlip) return null;

  const isStaff = !selectedSlip.employeeLine || String(selectedSlip.employeeLine).trim() === '';

  const formatPeriod = (periodStr) => {
    if (!periodStr) return '';
    const [year, month] = periodStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const getLastDay = (periodStr) => {
    if (!periodStr) return 30;
    const [year, month] = periodStr.split('-');
    return new Date(year, parseInt(month), 0).getDate();
  };

  return (
    <div className="bg-white text-black p-1 w-full slip-page-break" style={{ fontFamily: '"Times New Roman", Times, serif', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Header */}
      <div className="text-center font-bold mb-1 text-[7px] leading-none">
        <p>PT. DWI BINTANG GLOBAL</p>
        <p>SLIP GAJI</p>
        <p>PERIODE 1 {formatPeriod(selectedSlip.period).toUpperCase()} s/d {getLastDay(selectedSlip.period)} {formatPeriod(selectedSlip.period).toUpperCase()}</p>
      </div>
      
      {/* Employee Info */}
      <div className="border-t border-b border-black py-[1.5px] mb-1">
        <table className="w-full font-bold table-fixed text-[6px] leading-none">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[4%]" />
            <col className="w-[78%]" />
          </colgroup>
          <tbody>
            <tr>
              <td className="py-[1.5px]">Nama</td>
              <td className="py-[1.5px]">:</td>
              <td className="py-[1.5px]">{selectedSlip.employeeName}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">NIK</td>
              <td className="py-[1.5px]">:</td>
              <td className="py-[1.5px]">{selectedSlip.employeeNik}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">Bagian</td>
              <td className="py-[1.5px]">:</td>
              <td className="py-[1.5px]">{selectedSlip.employeeDepartment} {selectedSlip.employeeLine && `(Line ${String(selectedSlip.employeeLine).replace('.0', '')})`}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table */}
      {isStaff ? (
        <table className="w-full table-fixed mb-1 text-[6px] leading-none">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[15%]" />
            <col className="w-[25%]" />
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[5%]" />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={2}></th>
              <th colSpan={2} className="text-center font-bold">POTONGAN</th>
              <th colSpan={2} className="text-center font-bold border-l border-black">ABSENSI</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr>
              <td className="py-[1.5px]">GAJI POKOK 2026</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.gajiPokok > 0 ? `Rp ${selectedSlip.details.gajiPokok.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Simp. Pokok Koperasi</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganPokokKoperasi > 0 ? `Rp ${selectedSlip.details.potonganPokokKoperasi.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">ALFA</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalAlfa || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN MASA KERJA</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganMasaKerja > 0 ? `Rp ${selectedSlip.details.tunjanganMasaKerja.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Simp. Wajib Koperasi</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganKoperasi > 0 ? `Rp ${selectedSlip.details.potonganKoperasi.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">IZIN</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalIzin || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN SKILL</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganSkill > 0 ? `Rp ${selectedSlip.details.tunjanganSkill.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">PPH 21</td>
              <td className="text-right pr-2 py-[1.5px]"></td>
              <td className="border-l border-black pl-1 py-[1.5px]">SAKIT</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalSakit || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN INSENTIF</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganInsentif > 0 ? `Rp ${selectedSlip.details.tunjanganInsentif.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">BPJS KES</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganBpjsKes > 0 ? `Rp ${selectedSlip.details.potonganBpjsKes.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">CUTI</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalCuti || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN TRANSPORT</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganTransport > 0 ? `Rp ${selectedSlip.details.tunjanganTransport.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">BPJS KETENAGAKERJAAN</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganBpjsTk > 0 ? `Rp ${selectedSlip.details.potonganBpjsTk.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN NOL ABSEN</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganAbsen > 0 ? `Rp ${selectedSlip.details.tunjanganAbsen.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Iuran Forum</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganForum > 0 ? `Rp ${selectedSlip.details.potonganForum.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td className="py-[1.5px]">GAJI 2026</td>
              <td className="text-right pr-2 py-[1.5px]">Rp {(selectedSlip.details.gajiPokok + selectedSlip.details.tunjanganMasaKerja + selectedSlip.details.tunjanganSkill + selectedSlip.details.tunjanganInsentif + selectedSlip.details.tunjanganTransport).toLocaleString('id-ID')}</td>
              <td className="py-[1.5px]">Tabungan Koperasi</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganAngsuranKoperasi > 0 ? `Rp ${selectedSlip.details.potonganAngsuranKoperasi.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td className="py-[1.5px]">HARI KERJA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {selectedSlip.details.totalHariHadir ?? (26 - (selectedSlip.details.totalHariAbsen || 0))} Hari</td>
              <td className="text-right pr-2 py-[1.5px]">Rp {(selectedSlip.details.gajiPokokProrata + selectedSlip.details.tunjanganMasaKerja + selectedSlip.details.tunjanganSkill + selectedSlip.details.tunjanganInsentif + selectedSlip.details.tunjanganTransport).toLocaleString('id-ID')}</td>
              <td className="py-[1.5px]">Kasbon / Ganti Rugi</td>
              <td className="text-right pr-2 py-[1.5px]">{(selectedSlip.details.potonganKasbon || 0) + (selectedSlip.details.potonganGantiRugi || 0) > 0 ? `Rp ${((selectedSlip.details.potonganKasbon || 0) + (selectedSlip.details.potonganGantiRugi || 0)).toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td className="py-[1.5px]"></td>
              <td className="text-right pr-2 py-[1.5px]"></td>
              <td className="border-b border-black py-[1.5px]">Potongan Izin/Alfa</td>
              <td className="border-b border-black text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganAbsen > 0 ? `Rp ${selectedSlip.details.potonganAbsen.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td className="py-[1.5px] font-bold">PENDAPATAN</td>
              <td className="text-right font-bold pr-2 py-[1.5px]">Rp {selectedSlip.totalPendapatan.toLocaleString('id-ID')}</td>
              <td className="py-[1.5px] font-bold">POTONGAN</td>
              <td className="text-right font-bold pr-2 py-[1.5px]">Rp {selectedSlip.totalPotongan.toLocaleString('id-ID')}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td colSpan={2} className="py-[1.5px] border-b border-black"></td>
              <td colSpan={2} className="py-[1.5px] border-b border-black"></td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="py-[1.5px]"></td>
            </tr>
            <tr>
              <td colSpan={2} className="py-[1.5px]"></td>
              <td className="text-right py-[1.5px] pr-2">TAKE HOME PAY</td>
              <td className="text-right font-bold pr-2 py-[1.5px]">Rp {selectedSlip.takeHomePay.toLocaleString('id-ID')}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="py-[1.5px]"></td>
            </tr>
            <tr>
              <td colSpan={2} className="py-[1.5px]"></td>
              <td className="text-right py-[1.5px] border-b border-black pr-2"></td>
              <td className="text-right font-bold pr-2 py-[1.5px] border-b border-black"></td>
              <td className="border-l border-black border-b py-[1.5px]"></td>
              <td className="border-b border-black py-[1.5px]"></td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="w-full table-fixed mb-1 text-[6px] leading-none">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[15%]" />
            <col className="w-[25%]" />
            <col className="w-[15%]" />
            <col className="w-[10%]" />
            <col className="w-[5%]" />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={2}></th>
              <th colSpan={2} className="text-center font-bold">POTONGAN</th>
              <th colSpan={2} className="text-center font-bold border-l border-black">ABSENSI</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr>
              <td className="py-[1.5px]">GAJI POKOK</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.gajiPokok > 0 ? `Rp ${selectedSlip.details.gajiPokok.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Simp. Pokok Koperasi</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganPokokKoperasi > 0 ? `Rp ${selectedSlip.details.potonganPokokKoperasi.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">ALFA</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalAlfa || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN NOL ABSEN</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganAbsen > 0 ? `Rp ${selectedSlip.details.tunjanganAbsen.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Simp. Wajib Koperasi</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganKoperasi > 0 ? `Rp ${selectedSlip.details.potonganKoperasi.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">IZIN</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalIzin || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">TUNJANGAN SKILL</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.tunjanganSkill > 0 ? `Rp ${selectedSlip.details.tunjanganSkill.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Potongan Koperasi</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganAngsuranKoperasi > 0 ? `Rp ${selectedSlip.details.potonganAngsuranKoperasi.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">SAKIT</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalSakit || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">HARI KERJA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {selectedSlip.details.totalHariHadir ?? (26 - (selectedSlip.details.totalHariAbsen || 0))} Hari</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.gajiPokokProrata > 0 ? `Rp ${selectedSlip.details.gajiPokokProrata.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">BPJS KETENAGAKERJAAN</td>
              <td className="text-right pr-2 py-[1.5px]">{selectedSlip.details.potonganBpjsTk > 0 ? `Rp ${selectedSlip.details.potonganBpjsTk.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px]">CUTI</td>
              <td className="text-right pr-1 py-[1.5px]">{selectedSlip.details.totalCuti || 0}</td>
            </tr>
            <tr>
              <td className="py-[1.5px]">LEMBUR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {selectedSlip.details.totalOTHours > 0 ? `${selectedSlip.details.totalOTHours} Jam` : ''} {selectedSlip.details.totalOTHours > 0 ? ` Rp ${(selectedSlip.details.totalOTPay / selectedSlip.details.totalOTHours).toLocaleString('id-ID')}` : ''}</td>
              <td className="text-right pr-2 py-[1.5px] border-b border-black">{selectedSlip.details.totalOTPay > 0 ? `Rp ${selectedSlip.details.totalOTPay.toLocaleString('id-ID')}` : ''}</td>
              <td className="py-[1.5px]">Iuran Forum</td>
              <td className="text-right pr-2 py-[1.5px] border-b border-black">{selectedSlip.details.potonganForum > 0 ? `Rp ${selectedSlip.details.potonganForum.toLocaleString('id-ID')}` : ''}</td>
              <td className="border-l border-black pl-1 py-[1.5px] text-white">OFF</td>
              <td className="text-right pr-1 py-[1.5px]">0</td>
            </tr>
            <tr>
              <td className="py-[1.5px] font-bold mt-1">PENDAPATAN</td>
              <td className="text-right font-bold pr-2 py-[1.5px] mt-1">Rp {selectedSlip.totalPendapatan.toLocaleString('id-ID')}</td>
              <td className="py-[1.5px] font-bold mt-1">POTONGAN</td>
              <td className="text-right font-bold pr-2 py-[1.5px] mt-1">Rp {selectedSlip.totalPotongan.toLocaleString('id-ID')}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="pr-1 py-[1.5px]"></td>
            </tr>
            <tr>
              <td colSpan={2} className="py-[1.5px] border-b border-black mt-2"></td>
              <td colSpan={2} className="py-[1.5px] border-b border-black mt-2"></td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="py-[1.5px]"></td>
            </tr>
            <tr>
              <td colSpan={2} className="py-[1.5px]"></td>
              <td className="text-right font-bold py-[1.5px] pr-2">GAJI BERSIH</td>
              <td className="text-right font-bold pr-2 py-[1.5px]">Rp {selectedSlip.takeHomePay.toLocaleString('id-ID')}</td>
              <td className="border-l border-black py-[1.5px]"></td>
              <td className="py-[1.5px]"></td>
            </tr>
            <tr>
              <td colSpan={2} className="py-[1.5px]"></td>
              <td className="text-right py-[1.5px] border-b border-black pr-2"></td>
              <td className="text-right font-bold pr-2 py-[1.5px] border-b border-black"></td>
              <td className="border-l border-black border-b py-[1.5px]"></td>
              <td className="border-b border-black py-[1.5px]"></td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Signature */}
      <div className="mt-1 text-right">
        <div className="inline-block text-center mr-8 text-[7px]">
          <p className="mb-4">PAYROLL</p>
          <p className="font-bold">KHOLIMAH</p>
        </div>
      </div>
    </div>
  );
};

export default SlipGajiTemplate;
