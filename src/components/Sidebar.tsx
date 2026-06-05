import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  ClipboardList, 
  User, 
  LogOut,
  TrendingUp,
  Users,
  BookOpen
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useModal } from './ModalContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { confirm } = useModal();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'ออกจากระบบ',
      message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      type: 'danger',
      confirmText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก'
    });

    if (isConfirmed) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const studentMenuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
    { to: '/check-in', label: 'Check-in History', icon: <MapPin size={22} /> },
    { to: '/logbook-cases', label: 'My Logbook Cases', icon: <ClipboardList size={22} /> },
    { to: '/profile', label: 'Profile', icon: <User size={22} /> },
  ];

  const preceptorMenuItems = [
    { to: '/preceptor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
    { to: '/evaluate-procedures', label: 'Evaluate Cases', icon: <ClipboardList size={22} /> },
    { to: '/verify-shifts', label: 'Verify Shifts', icon: <MapPin size={22} /> },
    { to: '/profile', label: 'Profile', icon: <User size={22} /> },
  ];

  const adminMenuItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
    { to: '/admin/progress', label: 'Student Progress', icon: <TrendingUp size={22} /> },
    { to: '/admin/locations', label: 'Locations Management', icon: <MapPin size={22} /> },
    { to: '/admin/procedures', label: 'Procedures Management', icon: <ClipboardList size={22} /> },
    { to: '/admin/accounts', label: 'Accounts Management', icon: <Users size={22} /> },
    { to: '/admin/courses', label: 'Courses Management', icon: <BookOpen size={22} /> },
    { to: '/profile', label: 'Profile', icon: <User size={22} /> },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : role === 'preceptor' ? preceptorMenuItems : studentMenuItems;

  return (
    <aside 
      className="relative h-screen bg-white border-r-2 border-slate-100 flex flex-col w-20 min-w-[80px] lg:w-72 lg:min-w-[288px] sticky top-0 z-50 overflow-hidden transition-all duration-300"
    >
      {/* Top: Logo Section */}
      <div className="h-20 lg:h-24 flex items-center justify-center lg:justify-start lg:px-8 shrink-0">
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500 overflow-hidden">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-slate-900 min-w-max hidden lg:block">
            <h1 className="text-xl font-bold leading-none tracking-tight">Medical Logbook</h1>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow px-2 lg:px-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex items-center gap-4 h-12 lg:px-4 rounded-2xl transition-all duration-300 group relative justify-center lg:justify-start ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div className="transition-transform group-hover:scale-110 shrink-0 flex items-center justify-center w-6">
              {item.icon}
            </div>
            <span className="font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap hidden lg:block">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Logout Section */}
      <div className="p-2 lg:p-4 mt-auto mb-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 h-12 lg:px-4 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 group justify-center lg:justify-start"
        >
          <div className="shrink-0 flex items-center justify-center w-6">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-500 hidden lg:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
