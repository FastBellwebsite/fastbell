import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StudentProfile, Address } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { FastBellSelect } from '@/components/FastBellSelect';
import { ThemeToggle } from '@/components/ThemeToggle';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().min(10, 'Enter your 10-digit phone number.'),
  department: z.string().min(1, 'Select your department.'),
  year: z.string().min(1, 'Select your year of study.'),
  campus: z.string().min(1, 'Select your campus.'),
  address: z.string().min(3, 'Enter your hostel room or delivery address line.'),
  locality: z.string().min(2, 'Enter your campus area or locality.'),
  city: z.string().min(2, 'Enter your city.'),
  state: z.string().min(2, 'Enter your state.'),
  postalCode: z.string().min(5, 'Enter your postal/PIN code.'),
  landmark: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'AI & ML',
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Studies (MBA)'
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export default function RegisterStudent() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const {
    register: registerField,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      campus: 'SNS College of Technology',
      department: 'Computer Science & Engineering (CSE)',
      year: '1st Year',
      locality: 'SNS Campus',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641049'
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const studentAddress: Address = {
        id: `addr-${Date.now()}`,
        label: 'Primary Delivery',
        line: data.address.trim(),
        locality: data.locality.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        landmark: data.landmark?.trim() || data.campus,
        latitude: 11.1271,
        longitude: 76.9966
      };

      const newUser: StudentProfile = {
        id: `STU-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        department: data.department,
        year: data.year,
        campusId: 'sns',
        role: 'student',
        deliveryLocation: `${data.address.trim()}, ${data.locality.trim()}`,
        location: {
          latitude: 11.1271,
          longitude: 76.9966,
          address: data.address.trim(),
          locality: data.locality.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim()
        },
        addresses: [studentAddress],
        favorites: []
      };

      await register(newUser);
      toast.success(`Welcome to FastBell, ${newUser.name}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] flex flex-col md:flex-row selection:bg-[var(--fb-blue)] selection:text-white fade-in">
      {/* LEFT SIDE - Brand World */}
      <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col p-6 md:p-10 border-b md:border-b-0 md:border-r border-[var(--fb-border)] md:fixed md:top-0 md:bottom-0 md:left-0 bg-[var(--fb-surface)] relative overflow-hidden group">
        
        {/* Meaningful Contextual Imagery Background */}
        <div className="absolute inset-0 z-0">
          <img src="/student-campus-lifestyle.jpg" className="w-full h-full object-cover opacity-40" alt="Campus Essentials" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--fb-surface)] via-[var(--fb-surface)]/90 to-[var(--fb-surface)]/60" />
          <div className="absolute inset-0 bg-[var(--role-student-bg)] mix-blend-color opacity-30" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
                <span className="font-display text-2xl font-black tracking-tight text-[var(--fb-ink)]">
                  Fast<span className="italic font-medium text-[var(--fb-blue)]">Bell</span>
                </span>
              </Link>
              <ThemeToggle />
            </div>

            <span className="inline-block px-2.5 py-1 mb-6 text-[11px] font-bold uppercase tracking-wider bg-[var(--role-student-bg)] text-[var(--role-student-color)] rounded-sm border border-[var(--role-student-color)]/20">
              Student Access
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-[var(--fb-ink)] leading-[0.9] tracking-tighter mb-4">
              Unlock your campus.
            </h1>
            <p className="text-sm text-[var(--fb-text-secondary)] font-medium max-w-sm leading-relaxed border-l-2 border-[var(--role-student-color)] pl-4">
              Get food, essentials, and laundry delivered straight to your hostel or department in minutes.
            </p>
          </div>
          
          <div className="hidden md:block">
            {/* Decorative bottom element */}
            <div className="flex gap-2 opacity-20">
              <div className="w-16 h-1 bg-[var(--fb-ink)]" />
              <div className="w-4 h-1 bg-[var(--fb-ink)]" />
              <div className="w-4 h-1 bg-[var(--fb-ink)]" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Registration Form */}
      <div className="w-full md:w-[65%] lg:w-[70%] flex flex-col bg-[var(--fb-bg)] md:ml-[35%] lg:ml-[30%] min-h-full">
        <div className="flex-1 flex flex-col p-6 max-w-3xl w-full mx-auto">
          
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] transition-colors mb-6"
            >
              <ArrowLeft size={14} /> Back to Auth
            </Link>

            <h2 className="font-display text-2xl md:text-3xl font-black text-[var(--fb-ink)] tracking-tighter mb-1">
              Create an account
            </h2>
            <p className="text-[11px] font-bold text-[var(--fb-text-secondary)] uppercase tracking-widest">
              Register your verified student profile and personal delivery location.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Personal Info */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                01. Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Full Name
                  </label>
                  <input
                    {...registerField('name')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.name ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.name.message}</p>}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Email Address
                  </label>
                  <input
                    {...registerField('email')}
                    type="email"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.email ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="name@sns.fastbell"
                  />
                  {errors.email && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.email.message}</p>}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Phone Number
                  </label>
                  <input
                    {...registerField('phone')}
                    type="tel"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.phone ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="9876543210"
                  />
                  {errors.phone && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.phone.message}</p>}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Password
                  </label>
                  <input
                    {...registerField('password')}
                    type="password"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.password ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Student Department & Year */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                02. Academic Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Department
                  </label>
                  <FastBellSelect
                    name="department"
                    id="department"
                    options={[
                      { value: '', label: 'Select Department...' },
                      ...DEPARTMENTS.map(dept => ({ value: dept, label: dept }))
                    ]}
                    value={watch('department')}
                    onChange={(val) => setValue('department', val, { shouldValidate: true })}
                    className={errors.department ? 'border-[var(--fb-danger)]' : ''}
                  />
                  {errors.department && (
                    <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.department.message}</p>
                  )}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Year of Study
                  </label>
                  <FastBellSelect
                    name="year"
                    id="year"
                    options={[
                      { value: '', label: 'Select Year...' },
                      ...YEARS.map(yr => ({ value: yr, label: yr }))
                    ]}
                    value={watch('year')}
                    onChange={(val) => setValue('year', val, { shouldValidate: true })}
                    className={errors.year ? 'border-[var(--fb-danger)]' : ''}
                  />
                  {errors.year && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.year.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 3: Delivery Location & Address */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                03. Delivery Location
              </h3>
              
              <div className="relative group">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                  Delivery Address / Room Line
                </label>
                <input
                  {...registerField('address')}
                  type="text"
                  className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.address ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                  placeholder="Hostel Block B, Room 204"
                />
                {errors.address && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Area / Locality
                  </label>
                  <input
                    {...registerField('locality')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-sm font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.locality ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="SNS Campus"
                  />
                  {errors.locality && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.locality.message}</p>}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    City
                  </label>
                  <input
                    {...registerField('city')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-sm font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.city ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="Coimbatore"
                  />
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    State
                  </label>
                  <input
                    {...registerField('state')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-sm font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.state ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="Tamil Nadu"
                  />
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Postal Code
                  </label>
                  <input
                    {...registerField('postalCode')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-sm font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.postalCode ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="641049"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto btn-action-primary"
            >
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--fb-border)] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--fb-text-secondary)]">
            <span>Already registered?</span>
            <Link to="/auth/student" className="text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors border-b border-[var(--fb-ink)] pb-0.5 hover:border-[var(--fb-blue)]">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
