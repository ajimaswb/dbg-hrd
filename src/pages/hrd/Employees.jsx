import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, X, Search, Filter, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, createEmployee, deleteEmployee, updateEmployee } from '../../utils/employeeService';
import * as XLSX from 'xlsx-js-style';

const POSITIONS = {
  'Finance': ['Staff'],
  'Merchandiser': ['Staff'],
  'PPIC': ['Staff'],
  'HRD': ['Staff'],
  'Warehouse': ['Staff', 'Admin', 'Leader', 'Chief'],
  'EXIM': ['Staff'],
  'Pattern': ['Staff', 'Admin', 'Leader', 'Chief', 'SPV', 'Operator'],
  'Cutting': ['Chief', 'Leader', 'SPV', 'Admin', 'Operator'],
  'Sample Room': ['Staff', 'Operator', 'Leader', 'SPV'],
  'Sewing': ['Operator', 'Helper', 'SPV', 'Admin', 'Chief'],
  'QC': ['QC Fabric', 'QC In Line', 'QC Output', 'QC Finishing', 'QC Accuracy'],
  'Finishing': ['Ironing', 'Folding', 'Packing', 'Leader', 'Chief'],
  'Factory Manager': ['Factory Manager'],
  'Kepala Produksi': ['Kepala Produksi'],
  'Direksi': ['Direktur', 'Komisaris']
};

const checkHasLine = (dept, pos) => {
  if (dept === 'Sewing' && ['Operator', 'Helper', 'Admin', 'SPV'].includes(pos)) return true;
  if (dept === 'QC' && ['QC In Line', 'QC Output'].includes(pos)) return true;
  return false;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const CurrencyInput = ({ label, name, value, onChange }) => (
  <div>
    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-slate-500 sm:text-sm">Rp</span>
      </div>
      <input 
        name={name} 
        type="text" 
        value={value} 
        onChange={onChange} 
        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
      />
    </div>
  </div>
);

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLine, setFilterLine] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    department: 'Sewing',
    position: 'Operator',
    line: '',
    role: 'employee',
    status: 'aktif',
    gaji_pokok: '',
    tunjangan_masa_kerja: '',
    tunjangan_skill: '',
    tunjangan_jabatan: '',
    tunjangan_insentif: '',
    tunjangan_transport: '',
    tunjangan_absen: '',
    potongan_koperasi_wajib: '',
    potongan_bpjs_tk: '',
    potongan_bpjs_kes: '',
    potongan_forum: '',
    potongan_ganti_rugi: '',
    potongan_kasbon: '',
    potongan_pokok_koperasi: '',
    potongan_simpanan_bersama: '',
    potongan_angsuran_koperasi: '',
    joinDate: '',
    bankName: 'BCA',
    bankAccount: ''
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '';
    return Number(val).toLocaleString('id-ID');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format currency fields
    if (name.includes('gaji') || name.includes('tunjangan') || name.includes('potongan')) {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue ? parseInt(numericValue, 10).toLocaleString('id-ID') : ''
      }));
      return;
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Jika department berubah, reset jabatan (position) ke default jabatan pertama departemen tsb
      if (name === 'department') {
        updated.position = POSITIONS[value][0] || '';
      }
      
      // Line hanya berlaku untuk role tertentu
      if (!checkHasLine(updated.department, updated.position)) {
        updated.line = '';
      }
      return updated;
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nik: '',
      name: '',
      department: 'Sewing',
      position: 'Operator',
      line: '',
      role: 'employee',
      status: 'aktif',
      gaji_pokok: '',
      tunjangan_masa_kerja: '',
      tunjangan_skill: '',
      tunjangan_jabatan: '',
      tunjangan_insentif: '',
      tunjangan_transport: '',
      tunjangan_absen: '',
      potongan_koperasi_wajib: '',
      potongan_bpjs_tk: '',
      potongan_bpjs_kes: '',
      potongan_forum: '',
      potongan_ganti_rugi: '',
      potongan_kasbon: '',
      potongan_pokok_koperasi: '',
      potongan_simpanan_bersama: '',
      potongan_angsuran_koperasi: '',
      joinDate: '',
      bankName: 'BCA',
      bankAccount: ''
    });
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      nik: emp.nik || '',
      name: emp.name || '',
      department: emp.department || 'Sewing',
      position: emp.position || 'Operator',
      line: emp.line || '',
      status: emp.status || 'aktif',
      gaji_pokok: formatCurrency(emp.components?.gaji_pokok),
      tunjangan_masa_kerja: formatCurrency(emp.components?.tunjangan_masa_kerja),
      tunjangan_skill: formatCurrency(emp.components?.tunjangan_skill),
      tunjangan_jabatan: formatCurrency(emp.components?.tunjangan_jabatan),
      tunjangan_insentif: formatCurrency(emp.components?.tunjangan_insentif),
      tunjangan_transport: formatCurrency(emp.components?.tunjangan_transport),
      tunjangan_absen: formatCurrency(emp.components?.tunjangan_absen),
      potongan_koperasi_wajib: formatCurrency(emp.components?.potongan_koperasi_wajib),
      potongan_bpjs_tk: formatCurrency(emp.components?.potongan_bpjs_tk),
      potongan_bpjs_kes: formatCurrency(emp.components?.potongan_bpjs_kes),
      potongan_forum: formatCurrency(emp.components?.potongan_forum),
      potongan_ganti_rugi: formatCurrency(emp.components?.potongan_ganti_rugi),
      potongan_kasbon: formatCurrency(emp.components?.potongan_kasbon),
      potongan_pokok_koperasi: formatCurrency(emp.components?.potongan_pokok_koperasi),
      potongan_simpanan_bersama: formatCurrency(emp.components?.potongan_simpanan_bersama),
      potongan_angsuran_koperasi: formatCurrency(emp.components?.potongan_angsuran_koperasi),
      joinDate: emp.joinDate || '',
      bankName: emp.bankName || 'BCA',
      bankAccount: emp.bankAccount || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { 
        gaji_pokok, tunjangan_masa_kerja, tunjangan_skill, tunjangan_jabatan, tunjangan_insentif, tunjangan_transport, tunjangan_absen,
        potongan_koperasi_wajib, potongan_bpjs_tk, potongan_bpjs_kes, potongan_forum, potongan_ganti_rugi, potongan_kasbon, potongan_pokok_koperasi, potongan_simpanan_bersama, potongan_angsuran_koperasi,
        ...rest 
      } = formData;
      
      const payload = {
        ...rest,
        status: formData.status,
        position: formData.position,
        joinDate: formData.joinDate,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        components: {
          gaji_pokok: Number(String(gaji_pokok).replace(/\D/g, '')) || 0,
          tunjangan_masa_kerja: Number(String(tunjangan_masa_kerja).replace(/\D/g, '')) || 0,
          tunjangan_skill: Number(String(tunjangan_skill).replace(/\D/g, '')) || 0,
          tunjangan_jabatan: Number(String(tunjangan_jabatan).replace(/\D/g, '')) || 0,
          tunjangan_insentif: Number(String(tunjangan_insentif).replace(/\D/g, '')) || 0,
          tunjangan_transport: Number(String(tunjangan_transport).replace(/\D/g, '')) || 0,
          tunjangan_absen: Number(String(tunjangan_absen).replace(/\D/g, '')) || 0,
          potongan_koperasi_wajib: Number(String(potongan_koperasi_wajib).replace(/\D/g, '')) || 0,
          potongan_bpjs_tk: Number(String(potongan_bpjs_tk).replace(/\D/g, '')) || 0,
          potongan_bpjs_kes: Number(String(potongan_bpjs_kes).replace(/\D/g, '')) || 0,
          potongan_forum: Number(String(potongan_forum).replace(/\D/g, '')) || 0,
          potongan_ganti_rugi: Number(String(potongan_ganti_rugi).replace(/\D/g, '')) || 0,
          potongan_kasbon: Number(String(potongan_kasbon).replace(/\D/g, '')) || 0,
          potongan_pokok_koperasi: Number(String(potongan_pokok_koperasi).replace(/\D/g, '')) || 0,
          potongan_simpanan_bersama: Number(String(potongan_simpanan_bersama).replace(/\D/g, '')) || 0,
          potongan_angsuran_koperasi: Number(String(potongan_angsuran_koperasi).replace(/\D/g, '')) || 0
        }
      };

      if (editingId) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }
      
      setShowModal(false);
      fetchEmployees();
    } catch (e) {
      alert("Gagal menyimpan: " + e.message);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteEmployee(deleteConfirmId);
      fetchEmployees();
      setDeleteConfirmId(null);
    } catch (e) {
      alert("Gagal menghapus: " + e.message);
    }
  };



  const handleExportExcel = () => {
    try {
      const dataToExport = [...sortedEmployees].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      const exportData = dataToExport.map((emp, index) => {
        const c = emp.components || {};
        
        const penerimaan = 
          (c.gaji_pokok || 0) + 
          (c.tunjangan_masa_kerja || 0) + 
          (c.tunjangan_skill || 0) + 
          (c.tunjangan_jabatan || 0) + 
          (c.tunjangan_insentif || 0) + 
          (c.tunjangan_transport || 0) + 
          (c.tunjangan_absen || 0);
          
        const potongan = 
          (c.potongan_koperasi_wajib || 0) + 
          (c.potongan_bpjs_tk || 0) + 
          (c.potongan_bpjs_kes || 0) + 
          (c.potongan_forum || 0) + 
          (c.potongan_ganti_rugi || 0) + 
          (c.potongan_kasbon || 0) + 
          (c.potongan_pokok_koperasi || 0) + 
          (c.potongan_simpanan_bersama || 0) + 
          (c.potongan_angsuran_koperasi || 0);

        return {
          'No': index + 1,
          'NIK': emp.nik,
          'Nama Karyawan': emp.name,
          'Departemen': emp.department,
          'Jabatan': emp.position,
          'Line': emp.line || '-',
          'Tanggal Bergabung': formatDate(emp.joinDate),
          'Gaji Pokok (Rp)': c.gaji_pokok || 0,
          'Tunjangan Masa Kerja (Rp)': c.tunjangan_masa_kerja || 0,
          'Tunjangan Skill (Rp)': c.tunjangan_skill || 0,
          'Tunjangan Jabatan (Rp)': c.tunjangan_jabatan || 0,
          'Tunjangan Insentif (Rp)': c.tunjangan_insentif || 0,
          'Tunjangan Transport (Rp)': c.tunjangan_transport || 0,
          'Tunjangan Absen (Rp)': c.tunjangan_absen || 0,
          'Potongan Koperasi (Rp)': c.potongan_koperasi_wajib || 0,
          'Potongan BPJS TK (Rp)': c.potongan_bpjs_tk || 0,
          'Potongan BPJS Kes (Rp)': c.potongan_bpjs_kes || 0,
          'Total Take Home Pay (Rp)': Math.max(0, penerimaan - potongan)
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const currencyCols = [];
      
      // Auto column widths & find currency cols
      const colWidths = [];
      const keys = Object.keys(exportData[0] || {});
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = keys[C] ? keys[C].length : 10;
        const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        
        // Header Styling
        if (headerCell) {
          headerCell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "0EA5E9" } }, // Sky-500
            alignment: { horizontal: "center", vertical: "center" }
          };
          if (headerCell.v && String(headerCell.v).includes('(Rp)')) {
            currencyCols.push(C);
          }
        }

        // Calculate max width
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v) {
            let val = String(cell.v);
            if (currencyCols.includes(C)) val = "Rp 00.000.000"; 
            if (val.length > maxLen) maxLen = val.length;
          }
        }
        colWidths[C] = { wch: maxLen + 2 };
      }
      worksheet['!cols'] = colWidths;

      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (!cell) continue;

          cell.s = { alignment: { vertical: "center" } };

          if (C === 0) {
            cell.s.alignment.horizontal = "center";
          }

          if (currencyCols.includes(C) && typeof cell.v === 'number') {
            cell.z = '"Rp" #,##0';
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Karyawan');
      
      XLSX.writeFile(workbook, `Data_Karyawan_DBG.xlsx`);
      toast.success('Data berhasil diekspor ke Excel!');
    } catch (error) {
      toast.error('Gagal mengekspor data');
      console.error(error);
    }
  };


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (emp.nik?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment ? emp.department === filterDepartment : true;
    const matchesLine = filterLine ? String(emp.line) === filterLine : true;
    return matchesSearch && matchesDept && matchesLine;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    if (sortConfig.key === 'gaji_pokok') {
      aVal = a.components?.gaji_pokok || 0;
      bVal = b.components?.gaji_pokok || 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const uniqueDepartments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))).sort();
  const uniqueLines = Array.from(new Set(employees.map(emp => String(emp.line)).filter(l => l && l !== 'undefined' && l.trim() !== ''))).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Data Karyawan</h2>
          <p className="text-slate-500 text-sm">Kelola profil, departemen, dan komponen gaji karyawan.</p>
        </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 shadow-sm"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Tambah Karyawan</span>
            </button>
          </div>
        </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIK atau Nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-48 flex items-center">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 value={filterDepartment}
                 onChange={(e) => setFilterDepartment(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 text-sm appearance-none"
               >
                  <option value="">Semua Departemen</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
               </select>
            </div>
            <div className="relative w-full sm:w-40 flex items-center">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 value={filterLine}
                 onChange={(e) => setFilterLine(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 text-sm appearance-none"
               >
                  <option value="">Semua Line</option>
                  {uniqueLines.map(line => (
                    <option key={line} value={line}>Line {line}</option>
                  ))}
               </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-slate-500">
              <tr>
                <th onClick={() => handleSort('nik')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">NIK {getSortIcon('nik')}</th>
                <th onClick={() => handleSort('name')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Nama Karyawan {getSortIcon('name')}</th>
                <th onClick={() => handleSort('department')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Departemen {getSortIcon('department')}</th>
                <th onClick={() => handleSort('position')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Jabatan {getSortIcon('position')}</th>
                <th onClick={() => handleSort('line')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Line {getSortIcon('line')}</th>
                <th onClick={() => handleSort('joinDate')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Tanggal Masuk {getSortIcon('joinDate')}</th>
                <th onClick={() => handleSort('bankName')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Bank {getSortIcon('bankName')}</th>
                <th onClick={() => handleSort('bankAccount')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">No. Rekening {getSortIcon('bankAccount')}</th>
                <th onClick={() => handleSort('gaji_pokok')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Gaji Pokok {getSortIcon('gaji_pokok')}</th>
                <th onClick={() => handleSort('status')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors">Status {getSortIcon('status')}</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-slate-400">Belum ada data karyawan.</td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{emp.nik}</td>
                    <td className="px-6 py-4">{emp.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{emp.department}</td>
                    <td className="px-6 py-4 text-slate-800 dark:text-white">{emp.position}</td>
                    <td className="px-6 py-4">
                      {emp.line ? <span className="text-xs bg-slate-200 px-2 py-1 rounded-md text-slate-700 whitespace-nowrap">Line {emp.line}</span> : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(emp.joinDate)}</td>
                    <td className="px-6 py-4 text-slate-500">{emp.bankName || '-'}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{emp.bankAccount || '-'}</td>
                    <td className="px-6 py-4">Rp {emp.components?.gaji_pokok?.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${emp.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <button onClick={() => handleEdit(emp)} className="p-2 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="empForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Info Dasar */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Informasi Dasar</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">NIK</label>
                      <input name="nik" value={formData.nik} onChange={handleChange} required className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" placeholder="DBG 123" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Nama Lengkap</label>
                      <input name="name" value={formData.name} onChange={handleChange} required className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" placeholder="Budi Santoso" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departemen</label>
                      <select name="department" value={formData.department} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                        {Array.from(new Set([...Object.keys(POSITIONS), ...employees.map(emp => emp.department).filter(Boolean)])).sort().map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Jabatan</label>
                      <select name="position" value={formData.position} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                        {Array.from(new Set([
                          ...(POSITIONS[formData.department] || []), 
                          ...employees.filter(emp => emp.department === formData.department).map(emp => emp.position).filter(Boolean)
                        ])).sort().map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${checkHasLine(formData.department, formData.position) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>Line</label>
                      <input 
                        name="line" 
                        type="number"
                        value={formData.line} 
                        onChange={handleChange} 
                        disabled={!checkHasLine(formData.department, formData.position)}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                        placeholder="5" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Tanggal Masuk</label>
                      <input name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Nama Bank</label>
                      <select name="bankName" value={formData.bankName} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                        <option value="BCA">BCA</option>
                        <option value="BJB">BJB</option>
                        <option value="BNI">BNI</option>
                        <option value="BRI">BRI</option>
                        <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                        <option value="CIMB Niaga">CIMB Niaga</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="Permata">Permata</option>
                        <option value="Lainnya">Lainnya...</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">No. Rekening</label>
                      <input name="bankAccount" type="text" value={formData.bankAccount} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" placeholder="1234567890" />
                    </div>
                  </div>
                </div>

                {/* Komponen Pendapatan */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Komponen Gaji Dasar & Tunjangan</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <CurrencyInput label="Gaji Pokok" name="gaji_pokok" value={formData.gaji_pokok} onChange={handleChange} />
                    <CurrencyInput label="Tunj. Jabatan" name="tunjangan_jabatan" value={formData.tunjangan_jabatan} onChange={handleChange} />
                    <CurrencyInput label="Tunj. Skill" name="tunjangan_skill" value={formData.tunjangan_skill} onChange={handleChange} />
                    <CurrencyInput label="Tunj. Insentif" name="tunjangan_insentif" value={formData.tunjangan_insentif} onChange={handleChange} />
                    <CurrencyInput label="Tunj. Masa Kerja" name="tunjangan_masa_kerja" value={formData.tunjangan_masa_kerja} onChange={handleChange} />
                    <CurrencyInput label="Tunj. Transport" name="tunjangan_transport" value={formData.tunjangan_transport} onChange={handleChange} />
                    <CurrencyInput label="Tunj. Absen (Statik)" name="tunjangan_absen" value={formData.tunjangan_absen} onChange={handleChange} />
                  </div>
                </div>

                {/* Komponen Potongan Default */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Komponen Potongan Statis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <CurrencyInput label="BPJS TK" name="potongan_bpjs_tk" value={formData.potongan_bpjs_tk} onChange={handleChange} />
                    <CurrencyInput label="BPJS KES" name="potongan_bpjs_kes" value={formData.potongan_bpjs_kes} onChange={handleChange} />
                    <CurrencyInput label="Forum" name="potongan_forum" value={formData.potongan_forum} onChange={handleChange} />
                    <CurrencyInput label="Ganti Rugi" name="potongan_ganti_rugi" value={formData.potongan_ganti_rugi} onChange={handleChange} />
                    <CurrencyInput label="Kasbon" name="potongan_kasbon" value={formData.potongan_kasbon} onChange={handleChange} />
                    <CurrencyInput label="Pokok Koperasi" name="potongan_pokok_koperasi" value={formData.potongan_pokok_koperasi} onChange={handleChange} />
                    <CurrencyInput label="Wajib Koperasi (Bln 1)" name="potongan_koperasi_wajib" value={formData.potongan_koperasi_wajib} onChange={handleChange} />
                    <CurrencyInput label="Simpanan Bersama" name="potongan_simpanan_bersama" value={formData.potongan_simpanan_bersama} onChange={handleChange} />
                    <CurrencyInput label="Angsuran Koperasi" name="potongan_angsuran_koperasi" value={formData.potongan_angsuran_koperasi} onChange={handleChange} />
                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button form="empForm" type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors shadow-md shadow-sky-200">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hapus Karyawan</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
              Apakah Anda yakin ingin menghapus data karyawan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-200"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
