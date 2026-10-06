import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function RoleLogin() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'submit' | 'none'>('none');

  const activeRole = (role as Role) || 'student';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const prevRoleRef = useRef(activeRole);
  useEffect(() => {
    if (prevRoleRef.current !== activeRole) {
      prevRoleRef.current = activeRole;
      reset({
        email: '',
        password: ''
      });
    }
  }, [activeRole, reset]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password, activeRole);
      if (activeRole === 'student') navigate('/');
      else navigate(`/${activeRole}`);
    } catch {
      // Error handled by auth service
    }
  };

  const getRegisterLink = () => {
    if (activeRole === 'vendor') return '/register/vendor';
    if (activeRole === 'delivery') return '/register/delivery';
    if (activeRole === 'student') return '/register/student';
    return null;
  };

  const regLink = getRegisterLink();

  const getRoleInfo = () => {
    switch (activeRole) {
      case 'vendor':
        return {
          title: 'Welcome back',
          desc: 'Sign in to manage your FastBell store.',
          label: 'Vendor Portal'
        };
      case 'delivery':
        return {
          title: 'Welcome back',
          desc: 'Sign in to manage your deliveries.',
          label: 'Delivery Portal'
        };
      case 'admin':
        return {
          title: 'Admin Access',
          desc: 'Sign in to manage the campus marketplace.',
          label: 'Admin Portal'
        };
      default:
        return {
          title: 'Welcome back',
          desc: 'Sign in to continue shopping nearby.',
          label: 'Student Portal'
        };
    }
  };

  const info = getRoleInfo();

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] flex flex-col md:flex-row font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      
      {/* LEFT SIDE - Brand & Commerce Visual World */}
      <div className="relative w-full md:w-[45%] flex flex-col justify-between p-6 md:p-10 lg:p-6 overflow-hidden">
        
        {/* Top Brand and Theme */}
        <div className="relative z-20 flex justify-between items-center w-full">
          <Link to="/" className="inline-block">
            <span className="font-display text-2xl font-black tracking-tight text-[var(--fb-ink)]">
              Fast<span className="italic font-medium text-[var(--fb-blue)]">Bell</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Center - Dynamic Commerce Composition */}
        <div className="relative z-10 flex-1 flex items-center justify-center min-h-[300px] my-8">
          <div className="relative w-full max-w-[320px] aspect-square">
            
            {/* Background Canvas Circle */}
            <div 
              className="absolute inset-0 rounded-full bg-white/50 border border-white/20 shadow-xl blur-3xl transition-all duration-700 ease-out"
              style={{
                transform: focusedField === 'password' ? 'scale(1.1) translateY(-10px)' : 'scale(1) translateY(0)',
                opacity: focusedField === 'none' ? 0.4 : 0.7
              }}
            />

            {/* Product 1: Notebook (Top Left) */}
            <div 
              className="absolute top-[5%] left-[5%] w-3/5 aspect-[4/5] bg-[var(--fb-surface)] rounded-lg shadow-xl overflow-hidden border border-black/5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: focusedField === 'email' ? 'translateY(-12px) scale(1.05) rotate(-4deg)' : 
                           focusedField === 'submit' ? 'translateY(-4px) scale(1) rotate(-6deg)' : 'translateY(0) scale(1) rotate(-8deg)',
                zIndex: 1
              }}
            >
              <img src="/products/classmate-notebook.webp" alt="Classmate Notebook" className="w-full h-full object-cover" />
            </div>

            {/* Product 2: Fries (Bottom Right) */}
            <div 
              className="absolute bottom-[5%] right-[5%] w-[55%] aspect-square bg-[var(--fb-surface)] rounded-full shadow-2xl overflow-hidden border-2 border-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: focusedField === 'password' ? 'translateY(-15px) scale(1.08) rotate(4deg)' : 
                           focusedField === 'submit' ? 'translateY(-5px) scale(1) rotate(0deg)' : 'translateY(0) scale(1) rotate(8deg)',
                zIndex: 2
              }}
            >
              <img src="/products/french-fries.webp" alt="French Fries" className="w-full h-full object-cover" />
            </div>

            {/* Product 3: Sanitizer (Center Floating) */}
            <div 
              className="absolute top-[35%] left-[45%] w-2/5 aspect-[3/4] bg-[var(--fb-surface)] rounded-lg shadow-xl overflow-hidden border border-black/5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: focusedField === 'submit' ? 'translateY(-20px) scale(1.1) rotate(2deg)' : 
                           focusedField === 'email' ? 'translateY(-5px) scale(1) rotate(6deg)' : 'translateY(0) scale(1) rotate(12deg)',
                zIndex: 3
              }}
            >
              <img src="/products/dettol-sanitizer.webp" alt="Sanitizer" className="w-full h-full object-cover" />
            </div>

            {/* Subtle Blue Accent Line */}
            <div 
              className="absolute -right-12 top-1/2 w-24 h-px bg-[var(--fb-blue)] transition-all duration-700 ease-out origin-left"
              style={{
                transform: focusedField === 'submit' ? 'scaleX(1.5)' : 'scaleX(0.5)',
                opacity: focusedField === 'none' ? 0 : 0.5
              }}
            />
          </div>
        </div>

        {/* Bottom Context */}
        <div className="relative z-20">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[var(--fb-ink)] leading-tight mb-3">
            Campus commerce,<br />
            without the runaround.
          </h1>
          <p className="text-sm text-[var(--fb-text-secondary)] font-medium flex items-center gap-2">
            <span className="w-4 h-px bg-[var(--fb-blue)]"></span>
            Food, essentials & everyday campus needs.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Authentication Form */}
      <div className="w-full md:w-[55%] flex flex-col bg-[var(--fb-surface)] shadow-2xl z-30">
        <div className="flex-1 flex flex-col justify-center px-6 py-8 md:px-6 lg:px-6 max-w-lg w-full mx-auto">
          
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] transition-colors mb-10"
            >
              <ArrowLeft size={16} /> {info.label}
            </Link>

            <h2 className="font-display text-3xl md:text-4xl font-black text-[var(--fb-ink)] tracking-tight mb-3">
              {info.title}
            </h2>
            <p className="text-base font-medium text-[var(--fb-text-secondary)]">
              {info.desc}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--fb-ink)] mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('none')}
                className={`w-full bg-[var(--fb-bg)] border border-transparent rounded-sm px-4 py-3.5 text-sm md:text-base text-[var(--fb-ink)] font-medium focus:outline-none focus:bg-[var(--fb-surface)] focus:border-[var(--fb-blue)] transition-all ${
                  errors.email ? 'border-[var(--fb-danger)] bg-red-50 focus:border-[var(--fb-danger)]' : ''
                }`}
                placeholder="name@sns.fastbell.com"
              />
              {errors.email && (
                <p className="mt-2 text-xs font-bold text-[var(--fb-danger)]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--fb-ink)] mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('none')}
                className={`w-full bg-[var(--fb-bg)] border border-transparent rounded-sm px-4 py-3.5 text-sm md:text-base text-[var(--fb-ink)] font-medium focus:outline-none focus:bg-[var(--fb-surface)] focus:border-[var(--fb-blue)] transition-all ${
                  errors.password ? 'border-[var(--fb-danger)] bg-red-50 focus:border-[var(--fb-danger)]' : ''
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-[var(--fb-danger)]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              onMouseEnter={() => setFocusedField('submit')}
              onMouseLeave={() => setFocusedField('none')}
              className="w-full relative flex justify-center items-center gap-3 bg-[var(--fb-blue)] text-white text-sm font-bold uppercase tracking-widest py-4 mt-8 rounded-sm overflow-hidden group hover:bg-[#254cdb] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 cursor-pointer shadow-[0_4px_14px_0_rgba(49,92,255,0.39)] hover:shadow-[0_6px_20px_rgba(49,92,255,0.23)] hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Authenticating...
                </>
              ) : (
                'Continue to FastBell'
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {regLink && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-[var(--fb-text-secondary)]">Don't have an account?</span>
                <Link to={regLink} className="font-bold text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors">
                  Create Account
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
