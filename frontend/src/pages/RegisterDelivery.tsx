import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DeliveryProfile } from '@/types';
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
  phone: z.string().min(10, 'Enter valid 10-digit phone number.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  vehicleType: z.string().min(1, 'Select your vehicle type.'),
  vehicleNumber: z.string().optional(),
  serviceArea: z.string().optional(),
  address: z.string().optional(),
  studentId: z.string().optional(),
  campus: z.string().min(1, 'Select your campus.')
});

type FormValues = z.infer<typeof schema>;

export default function RegisterDelivery() {
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
      vehicleType: 'Bicycle',
      serviceArea: 'SNS Campus Hostels',
      address: 'Staff Block D',
      studentId: '',
      vehicleNumber: ''
    }
  });

  const selectedVehicle = watch('vehicleType');

  const onSubmit = async (data: FormValues) => {
    try {
      const newUser: DeliveryProfile = {
        id: `DEL-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        role: 'delivery',
        campusId: 'sns',
        serviceArea: data.serviceArea?.trim() || 'SNS Campus Hostels',
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber?.trim(),
        location: {
          latitude: 11.1271,
          longitude: 76.9966,
          address: data.address?.trim() || 'SNS Campus Main Gate',
          locality: data.serviceArea?.trim() || 'SNS Campus',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          postalCode: '641049'
        }
      };

      await register(newUser);
      toast.success(`Welcome to the Fleet, ${newUser.name}!`);
      navigate('/delivery');
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
          <img src="/student-campus-lifestyle.jpg" className="w-full h-full object-cover opacity-80" alt="Campus Delivery Parcel" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--fb-surface)] via-[var(--fb-surface)]/80 to-[var(--fb-surface)]/40" />
          <div className="absolute inset-0 bg-[var(--role-delivery-bg)] mix-blend-color opacity-50" />
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

            <span className="inline-block px-2.5 py-1 mb-6 text-[11px] font-bold uppercase tracking-wider bg-[var(--role-delivery-bg)] text-[var(--role-delivery-color)] rounded-sm border border-[var(--role-delivery-color)]/20">
              Delivery Fleet
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-[var(--fb-ink)] leading-[0.9] tracking-tighter mb-4">
              Move the campus.
            </h1>
            <p className="text-sm text-[var(--fb-text-secondary)] font-medium max-w-sm leading-relaxed border-l-2 border-[var(--role-delivery-color)] pl-4">
              Join the FastBell fleet and earn by connecting students with campus stores.
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
              Join the Fleet
            </h2>
            <p className="text-[11px] font-bold text-[var(--fb-text-secondary)] uppercase tracking-widest">
              Register as a delivery partner for your campus network.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Partner Details */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                01. Personal Details
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
                    placeholder="Sanjay Kumar"
                  />
                  {errors.name && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.name.message}</p>}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    College ID (Roll No)
                  </label>
                  <input
                    {...registerField('studentId')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.studentId ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="732921CS101"
                  />
                  {errors.studentId && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.studentId.message}</p>}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Email Address
                  </label>
                  <input
                    {...registerField('email')}
                    type="email"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.email ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="sanjay@sns.fastbell"
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
                    placeholder="9876543230"
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

            {/* Section 2: Vehicle & Campus */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                02. Operations Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Delivery Method
                  </label>
                  <FastBellSelect
                    name="vehicleType"
                    id="vehicleType"
                    options={[
                      { value: 'Electric Scooter', label: 'Electric Scooter' },
                      { value: 'Bicycle', label: 'Bicycle' },
                      { value: 'Scooter', label: 'Scooter' },
                      { value: 'Walking', label: 'Walking' }
                    ]}
                    value={selectedVehicle}
                    onChange={(val) => setValue('vehicleType', val as any, { shouldValidate: true })}
                    className={errors.vehicleType ? 'border-[var(--fb-danger)]' : ''}
                  />
                  {errors.vehicleType && (
                    <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.vehicleType.message}</p>
                  )}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Campus Service Area
                  </label>
                  <input
                    {...registerField('serviceArea')}
                    type="text"
                    className="w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors text-[var(--fb-ink)]"
                    placeholder="SNS Campus Hostels"
                  />
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Partner Base Address / Station
                  </label>
                  <input
                    {...registerField('address')}
                    type="text"
                    className="w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors text-[var(--fb-ink)]"
                    placeholder="Staff Block D"
                  />
                </div>

                {(selectedVehicle === 'Scooter' || selectedVehicle === 'Electric Scooter') && (
                  <div className="relative group">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                      Vehicle Number
                    </label>
                    <input
                      {...registerField('vehicleNumber')}
                      type="text"
                      className="w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors text-[var(--fb-ink)]"
                      placeholder="TN 38 XX 1234"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto btn-action-primary"
            >
              {isSubmitting ? 'Registering...' : 'Join the Fleet'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--fb-border)] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--fb-text-secondary)]">
            <span>Already a delivery partner?</span>
            <Link to="/auth/delivery" className="text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors border-b border-[var(--fb-ink)] pb-0.5 hover:border-[var(--fb-blue)]">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
