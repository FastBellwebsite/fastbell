import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mockStoreService } from '@/services/mockStoreService';
import { VendorProfile, Store } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { FastBellSelect } from '@/components/FastBellSelect';
import { ThemeToggle } from '@/components/ThemeToggle';

const schema = z.object({
  name: z.string().min(2, 'Owner Full Name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(10, 'Enter valid 10-digit phone number.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  storeName: z.string().min(2, 'Store Name is required.'),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().min(3, 'Provide a brief store description.'),
  address: z.string().min(3, 'Store building/address line is required.'),
  locality: z.string().min(2, 'Locality is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  postalCode: z.string().min(5, 'Postal code is required.')
});

type FormValues = z.infer<typeof schema>;

const STORE_CATEGORIES = [
  { id: 'cat-food', name: 'Food & Meals' },
  { id: 'cat-grocery', name: 'Groceries & Snacks' },
  { id: 'cat-stationery', name: 'Stationery & Printing' },
  { id: 'cat-laundry', name: 'Campus Laundry' },
  { id: 'cat-care', name: 'Personal Care' }
];

export default function RegisterVendor() {
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
      category: 'cat-food',
      description: 'Fresh meals and snacks made to order for campus students.',
      locality: 'SNS Campus Commercial Area',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      postalCode: '641049'
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const vendorId = `VEN-${Date.now()}`;
      const storeId = `STORE-${Date.now()}`;

      const newStore: Store = {
        id: storeId,
        campusId: 'sns',
        vendorId,
        name: data.storeName.trim(),
        category: data.category,
        description: data.description.trim(),
        locationLabel: `${data.address.trim()}, ${data.locality.trim()}`,
        locality: data.locality.trim(),
        city: data.city.trim(),
        latitude: 11.1271,
        longitude: 76.9966,
        serviceRadiusKm: 6,
        isOpen: true,
        rating: 5.0,
        image:
          data.category === 'cat-food'
            ? 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
            : data.category === 'cat-stationery'
            ? 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&q=80'
            : data.category === 'cat-laundry'
            ? 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80'
            : 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
        distanceFromCampus: 150,
        deliveryMinutes: 15
      };

      const newUser: VendorProfile = {
        id: vendorId,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        role: 'vendor',
        campusId: 'sns',
        storeId,
        storeName: data.storeName.trim(),
        businessName: data.storeName.trim(),
        category: data.category,
        description: data.description.trim(),
        status: 'Active',
        location: {
          latitude: 11.1271,
          longitude: 76.9966,
          address: data.address.trim(),
          locality: data.locality.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim()
        }
      };

      mockStoreService.createStore(newStore);
      await register(newUser);

      toast.success(`Store "${newStore.name}" created and vendor registered!`);
      navigate('/vendor');
    } catch (err: any) {
      toast.error(err?.message || 'Vendor registration failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] flex flex-col md:flex-row selection:bg-[var(--fb-blue)] selection:text-white fade-in">
      {/* LEFT SIDE - Brand World */}
      <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col p-6 md:p-10 border-b md:border-b-0 md:border-r border-[var(--fb-border)] md:fixed md:top-0 md:bottom-0 md:left-0 bg-[var(--fb-surface)] relative overflow-hidden group">
        
        {/* Meaningful Contextual Imagery Background */}
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-80" alt="Campus Storefront" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--fb-surface)] via-[var(--fb-surface)]/80 to-[var(--fb-surface)]/40" />
          <div className="absolute inset-0 bg-[var(--role-vendor-bg)] mix-blend-color opacity-50" />
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

            <span className="inline-block px-2.5 py-1 mb-6 text-[11px] font-bold uppercase tracking-wider bg-[var(--role-vendor-bg)] text-[var(--role-vendor-color)] rounded-sm border border-[var(--role-vendor-color)]/20">
              Merchant Partners
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-[var(--fb-ink)] leading-[0.9] tracking-tighter mb-4">
              Power the campus.
            </h1>
            <p className="text-sm text-[var(--fb-text-secondary)] font-medium max-w-sm leading-relaxed border-l-2 border-[var(--role-vendor-color)] pl-4">
              List your campus store and reach students directly in their hostels.
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
              Create your store
            </h2>
            <p className="text-[11px] font-bold text-[var(--fb-text-secondary)] uppercase tracking-widest">
              Register your vendor account and list your store on the campus marketplace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Merchant Contact */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                01. Contact Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Owner Full Name
                  </label>
                  <input
                    {...registerField('name')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.name ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="Karthik Natarajan"
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
                    placeholder="store@sns.fastbell"
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
                    placeholder="9876543220"
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

            {/* Section 2: Store Details */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                02. Business Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Store Name
                  </label>
                  <input
                    {...registerField('storeName')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg md:text-xl font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.storeName ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="Karthik Campus Cafe"
                  />
                  {errors.storeName && (
                    <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.storeName.message}</p>
                  )}
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Category
                  </label>
                  <FastBellSelect
                    name="category"
                    id="category"
                    options={STORE_CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
                    value={watch('category')}
                    onChange={(val) => setValue('category', val, { shouldValidate: true })}
                    className={errors.category ? 'border-[var(--fb-danger)]' : ''}
                  />
                  {errors.category && (
                    <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.category.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2 relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Description
                  </label>
                  <textarea
                    {...registerField('description')}
                    rows={2}
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.description ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="Specialty meals, fast delivery..."
                  />
                  {errors.description && (
                    <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Store Location */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)] border-b border-[var(--fb-border)] pb-1">
                03. Physical Location
              </h3>
              
              <div className="relative group">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                  Store Address / Building Line
                </label>
                <input
                  {...registerField('address')}
                  type="text"
                  className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-lg font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.address ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                  placeholder="Shop No. 4, Student Amenities Block"
                />
                {errors.address && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-[var(--fb-danger)] uppercase tracking-wider">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                    Locality / Campus Area
                  </label>
                  <input
                    {...registerField('locality')}
                    type="text"
                    className={`w-full bg-transparent border-b border-[var(--fb-border)] px-0 py-2 text-sm font-medium focus:outline-none focus:border-[var(--fb-ink)] transition-colors ${errors.locality ? 'border-[var(--fb-danger)] focus:border-[var(--fb-danger)] text-[var(--fb-danger)]' : 'text-[var(--fb-ink)]'}`}
                    placeholder="SNS Campus Commercial Wing"
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
            <span>Already a merchant partner?</span>
            <Link to="/auth/vendor" className="text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors border-b border-[var(--fb-ink)] pb-0.5 hover:border-[var(--fb-blue)]">
              Vendor Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
