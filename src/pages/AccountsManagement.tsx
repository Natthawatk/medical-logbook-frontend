import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  User, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Edit2,
  Filter,
  CheckCircle2,
  Users,
  FileUp,
  Download,
  X,
  UploadCloud,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';
import { useRef } from 'react';

interface UserData {
  _id: string;
  firstname_lastname: string;
  email: string;
  role: 'student' | 'preceptor' | 'admin';
  student_id?: string;
  academic_status?: string;
  profile_image?: string;
  year?: number;
  workplace?: {
    _id: string;
    Location_name: string;
  };
}

const AccountsManagement = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ทั้งหมด');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user?.firstname_lastname || 'ผู้ดูแลระบบ';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userRes, unreadRes] = await Promise.all([
        api.get('/users'),
        api.get('/notifications/unread-count')
      ]);
      
      if (userRes.data.success) {
        setUsers(userRes.data.data);
        setFilteredUsers(userRes.data.data);
      }
      if (unreadRes.data.success) {
        setUnreadCount(unreadRes.data.count);
      }
    } catch (err) {
      console.error('Error fetching users data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = users.filter(user => 
      user.firstname_lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterRole !== 'ทั้งหมด') {
      const roleMap: Record<string, string> = {
        'นักศึกษา': 'student',
        'พี่เลี้ยง': 'preceptor',
        'แอดมิน': 'admin'
      };
      filtered = filtered.filter(user => user.role === roleMap[filterRole]);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, users, filterRole]);

  const handleAddUser = () => {
    navigate('/admin/accounts/new');
  };

  const handleEditUser = (id: string) => {
    navigate(`/admin/accounts/${id}/edit`);
  };

  const handleDownloadTemplate = () => {
    const headers = ['firstname_lastname', 'email', 'student_id', 'role', 'year', 'semester', 'phone_number', 'password'];
    const csvContent = headers.join(',') + '\n' + 
      'John Doe,john@example.com,660100123,student,3,1/2569,0812345678,password123\n' +
      'Jane Smith,jane@example.com,,preceptor,,1/2569,0898765432,pass456';
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await api.post('/users/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showToast(`นำเข้าสำเร็จ: สร้างใหม่ ${response.data.created} บัญชี, อัปเดต ${response.data.updated} บัญชี`, 'success');
        setShowImportModal(false);
        fetchData();
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเข้า');
      showToast('การนำเข้าข้อมูลล้มเหลว', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const roles = ['ทั้งหมด', 'นักศึกษา', 'พี่เลี้ยง', 'แอดมิน'];

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    preceptors: users.filter(u => u.role === 'preceptor').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[12px] font-black uppercase tracking-widest border border-amber-100 min-w-[80px]">แอดมิน</span>;
      case 'preceptor':
        return <span className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[12px] font-black uppercase tracking-widest border border-emerald-100 min-w-[80px]">พี่เลี้ยง</span>;
      default:
        return <span className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[12px] font-black uppercase tracking-widest border border-blue-100 min-w-[80px]">นักศึกษา</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active' || !status) {
      return (
        <span className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[12px] font-black uppercase tracking-tight border border-emerald-100 min-w-[120px]">
          <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
          ใช้งานอยู่
        </span>
      );
    }
    if (status === 'graduated') {
      return (
        <span className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[12px] font-black uppercase tracking-tight border border-blue-100 min-w-[120px]">
          <CheckCircle2 size={14} strokeWidth={3} />
          สำเร็จการศึกษา
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[12px] font-black uppercase tracking-tight border border-slate-100 min-w-[120px]">
        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
        ระงับใช้งาน
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
        <DashboardHeader 
          studentName={adminName} 
          unreadCount={unreadCount}
          onProfileClick={() => navigate('/profile')}
          onNotificationClick={() => navigate('/notifications')}
          showTitle={true}
          title="การจัดการข้อมูลบัญชีผู้ใช้"
          subtitle="จัดการข้อมูลนิสิต อาจารย์พี่เลี้ยง และผู้ดูแลระบบทั้งหมด"
        />

        <div className="max-w-7xl mx-auto space-y-8 mt-6">
          {/* 1. Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl"><Users size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><User size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">นักศึกษา</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.students}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">พี่เลี้ยง</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.preceptors}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-white shadow-md flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ShieldAlert size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">แอดมิน</p>
                <p className="text-3xl font-black text-slate-800 leading-tight">{stats.admins}</p>
              </div>
            </div>
          </div>

          {/* 2. Filters & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตามชื่อ, อีเมล หรือรหัสนักศึกษา..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 text-slate-800 font-bold px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <Filter size={18} />
                  {filterRole} 
                  <ChevronDown size={20} className={`transition-transform text-slate-400 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-50 rounded-2xl shadow-xl z-10 overflow-hidden">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setFilterRole(r); setIsFilterOpen(false); }}
                        className={`w-full text-left px-5 py-3 font-bold transition-colors hover:bg-slate-50 ${filterRole === r ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-white text-slate-700 px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition hover:bg-slate-50 border-2 border-slate-100 shadow-sm whitespace-nowrap text-sm uppercase tracking-widest"
              >
                <FileUp size={20} strokeWidth={3} />
                นำเข้าข้อมูล
              </button>

              <button 
                onClick={handleAddUser}
                className="flex-grow md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-200 whitespace-nowrap text-sm uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} />
                เพิ่มผู้ใช้
              </button>
            </div>
          </div>

          {/* 3. Users Table */}
          <div className="bg-white rounded-[40px] border-2 border-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="py-6 px-8">ข้อมูลผู้ใช้งาน</th>
                    <th className="py-6 px-8 text-center">บทบาท</th>
                    <th className="py-6 px-8 text-center">สังกัด / ชั้นปี</th>
                    <th className="py-6 px-8 text-center">สถานะ</th>
                    <th className="py-6 px-8 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:rotate-2 transition-transform">
                              {u.profile_image ? (
                                <img src={u.profile_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={24} className="text-slate-300" />
                              )}
                            </div>
                            <div>
                                <p className="font-black text-[15px] text-slate-800 leading-tight">{u.firstname_lastname}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail size={12} className="text-slate-400" />
                                    <p className="text-xs font-bold text-slate-400">{u.email}</p>
                                </div>
                                {u.student_id && <p className="text-[10px] font-black text-blue-600 mt-1 uppercase tracking-tighter">ID: {u.student_id}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="py-6 px-8 text-center">
                            {u.role === 'student' ? (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200">ชั้นปีที่ {u.year || '-'}</span>
                            ) : u.role === 'preceptor' ? (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200">{u.workplace?.Location_name || '-'}</span>
                            ) : (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200">N/A</span>
                            )}
                        </td>
                        <td className="py-6 px-8 text-center">
                          {getStatusBadge(u.academic_status || 'active')}
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEditUser(u._id)}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-blue-100"
                            >
                              <Edit2 size={18} strokeWidth={2.5} />
                            </button>
                            <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-rose-100">
                              <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                            <Users size={56} strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-900 text-xl font-black">ไม่พบข้อมูลผู้ใช้งาน</p>
                            <p className="text-slate-500 font-bold">ลองปรับการค้นหาหรือเพิ่มผู้ใช้รายใหม่เข้าสู่ระบบ</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isUploading && setShowImportModal(false)}></div>
            
            <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white">
              <div className="p-8 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">นำเข้าข้อมูลผู้ใช้ (.CSV)</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 tracking-[0.1em]">รองรับทั้งนักศึกษาและอาจารย์พี่เลี้ยง</p>
                </div>
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="p-3 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90 shadow-sm border border-slate-100"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="bg-blue-50/50 p-6 rounded-[32px] border-2 border-blue-100 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Download size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-700 leading-tight">ดาวน์โหลด Template</p>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight mt-0.5">ใช้รูปแบบไฟล์ที่ระบบกำหนด</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="px-5 py-2.5 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 active:scale-95"
                  >
                    Download
                  </button>
                </div>

                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative border-4 border-dashed rounded-[40px] p-16 transition-all flex flex-col items-center justify-center group cursor-pointer ${
                    isUploading ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/30 border-slate-100 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" disabled={isUploading} />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-5">
                      <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600"></div>
                      <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">กำลังดำเนินการ...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-slate-200 shadow-xl group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500 mb-8 border border-slate-50">
                        <UploadCloud size={48} strokeWidth={1.5} />
                      </div>
                      <p className="text-xl font-black text-slate-800 tracking-tight">คลิกเพื่อเลือกไฟล์ .CSV</p>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="bg-rose-50 p-5 rounded-[24px] border-2 border-rose-100 flex items-center gap-4 animate-in shake duration-500">
                    <AlertCircle className="text-rose-500 shrink-0" size={24} />
                    <p className="text-xs font-bold text-rose-600 leading-relaxed">{uploadError}</p>
                  </div>
                )}

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">คำแนะนำการใช้งาน</p>
                   <ul className="space-y-2">
                      <li className="text-[11px] font-bold text-slate-500 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        ระบุ role เป็น 'student', 'preceptor' หรือ 'admin'
                      </li>
                      <li className="text-[11px] font-bold text-slate-500 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        ระบุ semester (เทอม) เช่น '1/2569' สำหรับทั้งนักศึกษาและพี่เลี้ยง
                      </li>
                      <li className="text-[11px] font-bold text-slate-500 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        สำหรับนักศึกษา จำเป็นต้องระบุ student_id และ year
                      </li>
                      <li className="text-[11px] font-bold text-slate-500 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        ระบบจะใช้ email เป็นหลักในการตรวจสอบข้อมูลซ้ำ (Unique Key)
                      </li>
                   </ul>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default AccountsManagement;
