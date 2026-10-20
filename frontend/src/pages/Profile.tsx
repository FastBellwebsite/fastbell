import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Package,
  Heart,
  LogOut,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  X,
  GraduationCap,
  Phone,
  Mail,
  Building,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { getOrdersForStudent } from '@/selectors/orderSelectors';
import { campuses } from '@/data';
import { StudentProfile, Address } from '@/types';
import toast from 'react-hot-toast';
import { api } from '@/services/api';

type ProfileAddress = Address & {
  isDefault?: boolean;
  hostelName?: string;
  roomNumber?: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const { favorites } = useStore();
  const { orders } = useOrder();
  const {
    user,
    logout,
    updateProfile,
    refreshUser
  } = useAuth();

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  const [isAddressFormOpen, setIsAddressFormOpen] =
    useState(false);

  const [editingAddressId, setEditingAddressId] =
    useState<string | null>(null);

  const student =
    user as StudentProfile | null;

  const [editName, setEditName] =
    useState(user?.name || '');

  const [editPhone, setEditPhone] =
    useState(user?.phone || '');

  const [editDepartment, setEditDepartment] =
    useState(student?.department || '');

  const [editYear, setEditYear] =
    useState(student?.year || '');

  const [addressLabel, setAddressLabel] =
    useState('');

  const [addressLine, setAddressLine] =
    useState('');

  const [addressLocality, setAddressLocality] =
    useState('');

  const [addressCity, setAddressCity] =
    useState('');

  const [addressPostalCode, setAddressPostalCode] =
    useState('');

  const [addressLandmark, setAddressLandmark] =
    useState('');

  const [addressLatitude, setAddressLatitude] =
    useState<number | null>(null);

  const [addressLongitude, setAddressLongitude] =
    useState<number | null>(null);

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center font-sans px-4 py-10 md:py-14">
        <div className="w-full max-w-lg mx-auto text-center border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8 shadow-sm rounded-sm">
          <div className="h-16 w-16 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6 border border-[var(--fb-border)]">
            <GraduationCap size={28} strokeWidth={2} />
          </div>

          <h1 className="font-display text-2xl font-bold text-[var(--fb-ink)] mb-2 tracking-tight">
            Student Profile
          </h1>

          <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] font-normal mb-6 max-w-sm mx-auto leading-relaxed">
            Please sign in to view your campus profile, active orders, and saved delivery addresses.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--fb-ink)] hover:bg-[var(--fb-blue)] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-sm border border-[var(--fb-ink)]"
          >
            Sign In to FastBell
          </Link>
        </div>
      </div>
    );
  }

  const userAddresses =
    (student?.addresses || []) as ProfileAddress[];

  const myOrders = user.id
    ? getOrdersForStudent(orders, user.id)
    : [];

  const campusName =
    campuses.find(
      campus => campus.id === user.campusId
    )?.name || 'Campus';

  const activeAddress =
    userAddresses.find(
      address => address.isDefault === true
    ) || userAddresses[0];

  const activeLocality =
    activeAddress?.locality ||
    user.location?.locality ||
    'No location set';

  const resetAddressForm = () => {
    setAddressLabel('');
    setAddressLine('');
    setAddressLocality('');
    setAddressCity('');
    setAddressPostalCode('');
    setAddressLandmark('');
    setAddressLatitude(null);
    setAddressLongitude(null);
    setEditingAddressId(null);
  };

  const closeAddressForm = () => {
    resetAddressForm();
    setIsAddressFormOpen(false);
  };

  const refreshUserAddresses = async () => {
    await refreshUser();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const trimmedPhone = editPhone.trim();
    if (!trimmedPhone) {
      toast.error('Phone number cannot be empty');
      return;
    }

    const phoneDigits = trimmedPhone.replace(/[\s\-\(\)\+]/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      await updateProfile({
        name: editName.trim(),
        phone: trimmedPhone,
        ...(user.role === 'student'
          ? {
              department:
                editDepartment.trim(),
              year: editYear.trim()
            }
          : {})
      });

      setIsEditingProfile(false);

      toast.success(
        'Profile updated successfully'
      );
    } catch {
      // AuthContext handles the error toast.
    }
  };

  const openAddAddress = () => {
    resetAddressForm();

    setAddressLocality(
      user.location?.locality || ''
    );

    setAddressCity(
      user.location?.city || ''
    );

    setAddressPostalCode(
      user.location?.postalCode || ''
    );

    if (
      user.location?.latitude != null
    ) {
      setAddressLatitude(
        user.location.latitude
      );
    }

    if (
      user.location?.longitude != null
    ) {
      setAddressLongitude(
        user.location.longitude
      );
    }

    setIsAddressFormOpen(true);
  };

  const openEditAddress = (
    address: ProfileAddress
  ) => {
    if (!address.id) {
      toast.error(
        'This address cannot be edited'
      );
      return;
    }

    setEditingAddressId(address.id);
    setAddressLabel(
      address.label || ''
    );
    setAddressLine(
      address.line || ''
    );
    setAddressLocality(
      address.locality || ''
    );
    setAddressCity(
      address.city || ''
    );
    setAddressPostalCode(
      address.postalCode || ''
    );
    setAddressLandmark(
      address.landmark || ''
    );
    setAddressLatitude(
      address.latitude ?? null
    );
    setAddressLongitude(
      address.longitude ?? null
    );

    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!addressLine.trim()) {
      toast.error(
        'Address line is required'
      );
      return;
    }

    if (!addressCity.trim()) {
      toast.error('City is required');
      return;
    }

    if (!addressPostalCode.trim()) {
      toast.error(
        'Postal code is required'
      );
      return;
    }

    try {
      const payload = {
        label:
          addressLabel.trim() ||
          'Address',

        addressLine:
          addressLine.trim(),

        locality:
          addressLocality.trim() ||
          null,

        city:
          addressCity.trim(),

        state:
          user.location?.state ||
          'Tamil Nadu',

        postalCode:
          addressPostalCode.trim(),

        landmark:
          addressLandmark.trim() ||
          null,

        latitude:
          addressLatitude,

        longitude:
          addressLongitude,

        isDefault: true
      };

      if (editingAddressId) {
        await api.updateAddress(
          editingAddressId,
          payload
        );

        toast.success(
          'Address updated successfully'
        );
      } else {
        await api.createAddress(
          payload
        );

        toast.success(
          'Address added successfully'
        );
      }

      await refreshUserAddresses();

      closeAddressForm();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save address'
      );
    }
  };

  const handleSetActiveLocation = async (
    address: ProfileAddress
  ) => {
    if (!address.id) {
      toast.error(
        'This address cannot be activated'
      );
      return;
    }

    try {
      await api.updateAddress(
        address.id,
        {
          label: address.label,
          addressLine: address.line,
          locality:
            address.locality || null,
          hostelName:
            address.hostelName || null,
          roomNumber:
            address.roomNumber || null,
          city: address.city,
          state: address.state,
          postalCode:
            address.postalCode,
          landmark:
            address.landmark || null,
          latitude:
            address.latitude ?? null,
          longitude:
            address.longitude ?? null,
          isDefault: true
        }
      );

      await refreshUserAddresses();

      toast.success(
        `${address.label || 'Address'} is now your active delivery location`
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to set active location'
      );
    }
  };

  const handleDeleteAddress = async (
    addressId?: string
  ) => {
    if (!addressId) {
      return;
    }

    try {
      await api.deleteAddress(
        addressId
      );

      await refreshUserAddresses();

      toast.success(
        'Address removed'
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to remove address'
      );
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--fb-border)] pb-4">

        <div>
          <div className="flex items-center gap-2 mb-1">

            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--fb-blue)]">
              <Sparkles size={12} />
              Campus Student Profile
            </span>

            <span className="text-xs font-normal text-[var(--fb-text-muted)]">
              • {campusName}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
            My Account
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[var(--fb-surface)] hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--fb-danger)] font-bold text-xs uppercase tracking-wider border border-[var(--fb-border)] hover:border-[var(--fb-danger)] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">

        <div className="space-y-6">

          <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-sm p-6 shadow-sm text-center relative overflow-hidden">

            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--fb-blue)]" />

            <div className="relative pt-2">

              <div className="mx-auto w-20 h-20 rounded-sm bg-[var(--fb-blue)] text-white text-3xl font-black font-display flex items-center justify-center shadow-lg border border-[var(--fb-blue)] mb-4">
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                {user.name}
              </h2>

              <p className="text-[10px] font-bold text-[var(--fb-blue)] mt-1 uppercase tracking-wider">
                {user.role} Account
              </p>

              <div className="mt-4 pt-4 border-t border-[var(--fb-border)] space-y-2.5 text-left text-xs">

                <div className="flex items-center gap-2.5 text-[var(--fb-text-secondary)] font-normal">
                  <Mail
                    size={14}
                    className="text-[var(--fb-text-muted)] shrink-0"
                  />

                  <span className="truncate">
                    {user.email}
                  </span>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-2.5 text-[var(--fb-text-secondary)] font-normal">
                    <Phone
                      size={14}
                      className="text-[var(--fb-text-muted)] shrink-0"
                    />

                    <span>
                      {user.phone}
                    </span>
                  </div>
                )}

                {user.role === 'student' &&
                  (student?.department ||
                    student?.year) && (
                    <div className="flex items-center gap-2.5 text-[var(--fb-text-secondary)] font-normal">

                      <GraduationCap
                        size={14}
                        className="text-[var(--fb-blue)] shrink-0"
                      />

                      <span className="font-bold text-[var(--fb-ink)]">
                        {[
                          student?.department,
                          student?.year
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    </div>
                  )}

                <div className="flex items-center gap-2.5 text-[var(--fb-text-secondary)] font-normal">

                  <Building
                    size={14}
                    className="text-[var(--fb-text-muted)] shrink-0"
                  />

                  <span className="text-xs text-[var(--fb-text-muted)]">
                    {campusName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditName(
                    user.name
                  );

                  setEditPhone(
                    user.phone || ''
                  );

                  setEditDepartment(
                    student?.department ||
                      ''
                  );

                  setEditYear(
                    student?.year || ''
                  );

                  setIsEditingProfile(
                    true
                  );
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-[var(--fb-bg)] hover:bg-[var(--fb-ink)] hover:text-white text-[var(--fb-ink)] border border-[var(--fb-border)] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Edit3 size={14} />
                Edit Profile Details
              </button>
            </div>
          </div>

          <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-sm divide-y divide-[var(--fb-border)] overflow-hidden shadow-sm">

            <Link
              to="/orders"
              className="flex items-center justify-between p-4 hover:bg-[var(--fb-bg)] transition-colors group"
            >
              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-sm bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-ink)] flex items-center justify-center">
                  <Package size={15} />
                </div>

                <div className="text-left">

                  <p className="text-xs font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors">
                    Order History
                  </p>

                  <p className="text-[11px] text-[var(--fb-text-muted)] font-normal">
                    {myOrders.length}{' '}
                    orders placed
                  </p>
                </div>
              </div>

              <ChevronRight
                size={16}
                className="text-[var(--fb-text-muted)] group-hover:translate-x-0.5 transition-transform"
              />
            </Link>

            <Link
              to="/favorites"
              className="flex items-center justify-between p-4 hover:bg-[var(--fb-bg)] transition-colors group"
            >
              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-sm bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-danger)] flex items-center justify-center">
                  <Heart size={15} />
                </div>

                <div className="text-left">

                  <p className="text-xs font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-danger)] transition-colors">
                    Favorites & Wishlist
                  </p>

                  <p className="text-[11px] text-[var(--fb-text-muted)] font-normal">
                    {favorites.length}{' '}
                    saved items
                  </p>
                </div>
              </div>

              <ChevronRight
                size={16}
                className="text-[var(--fb-text-muted)] group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>

        <div className="space-y-6">

          <div className="grid grid-cols-3 gap-3 sm:gap-4">

            <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-4 sm:p-5 rounded-sm shadow-sm hover:border-[var(--fb-ink)] transition-colors">

              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-blue)] mb-3">
                <Package
                  size={16}
                  strokeWidth={2.5}
                />
              </span>

              <p className="font-display text-2xl sm:text-3xl font-black text-[var(--fb-ink)] leading-none">
                {myOrders.length}
              </p>

              <p className="text-xs font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mt-1.5">
                Orders
              </p>
            </div>

            <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-4 sm:p-5 rounded-sm shadow-sm hover:border-[var(--fb-ink)] transition-colors">

              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-danger)] mb-3">
                <Heart
                  size={16}
                  strokeWidth={2.5}
                />
              </span>

              <p className="font-display text-2xl sm:text-3xl font-black text-[var(--fb-ink)] leading-none">
                {favorites.length}
              </p>

              <p className="text-xs font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mt-1.5">
                Favorites
              </p>
            </div>

            <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-4 sm:p-5 rounded-sm shadow-sm hover:border-[var(--fb-ink)] transition-colors">

              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-success)] mb-3">
                <MapPin
                  size={16}
                  strokeWidth={2.5}
                />
              </span>

              <p className="font-display text-2xl sm:text-3xl font-black text-[var(--fb-ink)] leading-none">
                {userAddresses.length}
              </p>

              <p className="text-xs font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mt-1.5">
                Addresses
              </p>
            </div>
          </div>

          <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-sm p-6 shadow-sm">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[var(--fb-border)] pb-4">

              <div>

                <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] tracking-tight">
                  Saved Campus Addresses
                </h3>

                <p className="text-xs font-normal text-[var(--fb-text-secondary)] mt-0.5">
                  Deliveries will arrive directly at these hostel, lab, or department spots.
                </p>
              </div>

              <button
                onClick={openAddAddress}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--fb-ink)] hover:bg-[var(--fb-blue)] px-4 py-2.5 rounded-sm transition-colors border border-[var(--fb-ink)] cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <Plus size={14} />
                Add Address
              </button>
            </div>

            {isAddressFormOpen && (
              <form
                onSubmit={
                  handleSaveAddress
                }
                className="mb-6 p-5 rounded-sm border border-[var(--fb-border)] bg-[var(--fb-bg)] space-y-4"
              >

                <div className="flex items-center justify-between border-b border-[var(--fb-border)] pb-2">

                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">
                    {editingAddressId
                      ? 'Edit Campus Delivery Spot'
                      : 'New Campus Delivery Spot'}
                  </h4>

                  <button
                    type="button"
                    onClick={
                      closeAddressForm
                    }
                    className="text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      Label / Type
                    </label>

                    <input
                      type="text"
                      value={addressLabel}
                      onChange={e =>
                        setAddressLabel(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Hostel, Lab, Department"
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-surface)] p-2.5 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      Landmark / Block
                    </label>

                    <input
                      type="text"
                      value={addressLandmark}
                      onChange={e =>
                        setAddressLandmark(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Near Mess Ground, 2nd Floor"
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-surface)] p-2.5 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      Area / Locality
                    </label>

                    <input
                      type="text"
                      value={addressLocality}
                      onChange={e =>
                        setAddressLocality(
                          e.target.value
                        )
                      }
                      placeholder="Locality"
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-surface)] p-2.5 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      City
                    </label>

                    <input
                      type="text"
                      value={addressCity}
                      onChange={e =>
                        setAddressCity(
                          e.target.value
                        )
                      }
                      placeholder="City"
                      required
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-surface)] p-2.5 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      Postal Code
                    </label>

                    <input
                      type="text"
                      value={addressPostalCode}
                      onChange={e =>
                        setAddressPostalCode(
                          e.target.value
                        )
                      }
                      placeholder="Postal code"
                      required
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-surface)] p-2.5 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                    Room / Exact Spot
                  </label>

                  <input
                    type="text"
                    value={addressLine}
                    onChange={e =>
                      setAddressLine(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Room 204, Table 3, Main Porch"
                    required
                    className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-surface)] p-2.5 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--fb-border)]">

                  <button
                    type="button"
                    onClick={
                      closeAddressForm
                    }
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] rounded-sm cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[var(--fb-ink)] hover:bg-[var(--fb-blue)] text-white rounded-sm transition-colors border border-[var(--fb-ink)] cursor-pointer"
                  >
                    {editingAddressId
                      ? 'Save Address Changes'
                      : 'Save & Set Active Location'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">

              {userAddresses.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--fb-text-muted)] border border-dashed border-[var(--fb-border)] rounded-sm">
                  No saved campus addresses yet. Add your hostel room or lab for 1-click delivery checkout!
                </div>
              ) : (
                userAddresses.map(
                  (address, index) => {

                    /*
                     * IMPORTANT:
                     * The backend's isDefault field is
                     * the single source of truth for
                     * the active address.
                     */
                    const isActive =
                      address.isDefault === true;

                    return (
                      <div
                        key={
                          address.id ||
                          `${address.line}-${index}`
                        }
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-sm border transition-colors ${
                          isActive
                            ? 'border-[var(--fb-ink)] bg-black/5 dark:bg-white/5'
                            : 'border-[var(--fb-border)] bg-[var(--fb-surface)] hover:border-[var(--fb-ink)]'
                        }`}
                      >

                        <div className="flex items-start gap-3">

                          <div
                            className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 mt-0.5 ${
                              isActive
                                ? 'bg-[var(--fb-blue)] text-white'
                                : 'bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-text-muted)]'
                            }`}
                          >
                            <MapPin
                              size={16}
                            />
                          </div>

                          <div>

                            <div className="flex items-center gap-2 flex-wrap">

                              <p className="font-bold text-xs text-[var(--fb-ink)]">
                                {address.label}
                              </p>

                              {isActive ? (
                                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[var(--fb-blue)] text-white">
                                  Active Delivery Spot
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] border border-[var(--fb-border)] px-1.5 py-0.5 rounded-sm">
                                  {address.locality ||
                                    'Campus'}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[var(--fb-ink)] font-bold mt-1">
                              {address.line}
                            </p>

                            <p className="text-xs text-[var(--fb-text-secondary)] font-normal mt-0.5">

                              {[
                                address.locality,
                                address.city,
                                address.postalCode
                              ]
                                .filter(Boolean)
                                .join(', ')}

                              {address.landmark &&
                                ` • ${address.landmark}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetActiveLocation(
                                  address
                                )
                              }
                              className="text-xs font-bold uppercase tracking-wider text-[var(--fb-blue)] hover:text-[var(--fb-ink)] hover:underline px-2 py-1 cursor-pointer"
                            >
                              Set Active
                            </button>
                          )}

                          {address.id && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openEditAddress(
                                    address
                                  )
                                }
                                className="text-[var(--fb-text-muted)] hover:text-[var(--fb-blue)] p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-sm transition-colors cursor-pointer"
                                title="Edit Address"
                              >
                                <Edit3
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteAddress(
                                    address.id
                                  )
                                }
                                className="text-[var(--fb-text-muted)] hover:text-[var(--fb-danger)] p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm transition-colors cursor-pointer"
                                title="Delete Address"
                              >
                                <Trash2
                                  size={15}
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--fb-border)]">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">

                <div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">
                    Current Delivery Location
                  </h4>

                  <p className="text-xs text-[var(--fb-text-secondary)] font-normal mt-0.5">
                    Your active saved address is used to determine nearby FastBell stores.
                  </p>
                </div>

                <span className="text-xs font-normal text-[var(--fb-text-muted)] shrink-0 mt-1 sm:mt-0">
                  Current:{' '}

                  <strong className="text-[var(--fb-blue)] font-bold">
                    {activeLocality}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">

          <div className="w-full max-w-lg bg-[var(--fb-surface)] rounded-sm p-6 border border-[var(--fb-border)] shadow-2xl relative">

            <div className="flex items-center justify-between mb-5 border-b border-[var(--fb-border)] pb-3">

              <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] tracking-tight">
                Edit Student Profile
              </h3>

              <button
                onClick={() =>
                  setIsEditingProfile(
                    false
                  )
                }
                className="text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleSaveProfile
              }
              className="space-y-4"
            >

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                  Full Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={e =>
                    setEditName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-bg)] p-3 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={editPhone}
                  onChange={e =>
                    setEditPhone(
                      e.target.value
                    )
                  }
                  className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-bg)] p-3 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                  placeholder="e.g. 9876543210"
                />
              </div>

              {user.role === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      Department
                    </label>

                    <input
                      type="text"
                      value={editDepartment}
                      onChange={e =>
                        setEditDepartment(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Artificial Intelligence & Data Science"
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-bg)] p-3 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-1">
                      Academic Year
                    </label>

                    <input
                      type="text"
                      value={editYear}
                      onChange={e =>
                        setEditYear(
                          e.target.value
                        )
                      }
                      placeholder="e.g. 3rd Year"
                      className="w-full rounded-sm border border-[var(--fb-border)] bg-[var(--fb-bg)] p-3 text-xs font-semibold outline-none focus:border-[var(--fb-ink)] text-[var(--fb-ink)]"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--fb-border)]">

                <button
                  type="button"
                  onClick={() =>
                    setIsEditingProfile(
                      false
                    )
                  }
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] rounded-sm cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-[var(--fb-ink)] hover:bg-[var(--fb-blue)] text-white rounded-sm transition-colors border border-[var(--fb-ink)]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}