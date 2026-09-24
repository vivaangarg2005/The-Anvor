'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, AddressType } from '../lib/api';

type AddressBookProps = {
  selectable?: boolean;
  selectedAddressId?: string;
  onSelectAddress?: (addressId: string) => void;
  onAddressesLoaded?: (addresses: AddressType[]) => void;
};

export default function AddressBook({ selectable, selectedAddressId, onSelectAddress, onAddressesLoaded }: AddressBookProps) {
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Single source of truth for form state
  // null = idle list, 'add' = add new form, '<address_id>' = edit form for that address
  const [activeForm, setActiveForm] = useState<'add' | string | null>(null);

  const fetchAllAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAddresses();
      if (res && res.data) {
        setAddresses(res.data);
        if (onAddressesLoaded) {
          onAddressesLoaded(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setIsLoading(false);
    }
  }, [onAddressesLoaded]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllAddresses();
  }, [fetchAllAddresses]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(id);
      await fetchAllAddresses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await fetchAllAddresses();
    } catch (err) {
      console.error(err);
      alert('Failed to set default address');
    }
  };

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 min-w-0">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Saved Addresses</h2>
        {activeForm === null && (
          <button 
            onClick={() => setActiveForm('add')}
            className="text-[10px] text-stone-500 hover:text-stone-900 uppercase tracking-widest transition-colors cursor-pointer shrink-0"
          >
            + Add New
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-stone-500">Loading addresses...</p>
      ) : (
        <div className="space-y-4 w-full min-w-0">
          {addresses.map(addr => {
            if (activeForm === addr._id) {
              return (
                <AddressForm 
                  key={addr._id}
                  initialData={addr}
                  onCancel={() => setActiveForm(null)}
                  onSuccess={() => {
                    setActiveForm(null);
                    fetchAllAddresses();
                  }}
                />
              );
            }

            const isSelected = selectable && selectedAddressId === addr._id;

            return (
              <div 
                key={addr._id} 
                onClick={() => {
                  if (selectable && onSelectAddress) onSelectAddress(addr._id);
                }}
                className={`p-4 sm:p-6 border transition-colors w-full overflow-hidden ${
                  isSelected ? 'border-stone-900 bg-stone-50 shadow-sm' 
                  : addr.isDefault && !selectable ? 'border-stone-400 bg-stone-50' 
                  : 'border-stone-200 bg-white hover:border-stone-300'
                } ${selectable ? 'cursor-pointer' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-start gap-4 mb-4 min-w-0">
                  <p className="text-sm text-stone-900 font-medium flex flex-wrap items-center gap-2 wrap-break-word min-w-0 flex-1">
                    <span className="break-all sm:wrap-break-word min-w-0">{addr.recipientName}</span>
                    {addr.isDefault && (
                      <span className="text-[9px] bg-stone-900 text-white px-2 py-1 uppercase tracking-widest shrink-0">Default</span>
                    )}
                    {isSelected && (
                      <span className="text-[9px] border border-stone-900 text-stone-900 px-2 py-1 uppercase tracking-widest font-bold shrink-0">Selected</span>
                    )}
                  </p>
                  <div className="flex gap-3 sm:gap-4 flex-wrap">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveForm(addr._id);
                      }}
                      className="text-[10px] text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors cursor-pointer shrink-0"
                    >
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(addr._id);
                        }}
                        className="text-[10px] text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors cursor-pointer shrink-0"
                      >
                        Set Default
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(addr._id);
                      }}
                      className="text-[10px] text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors cursor-pointer shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="wrap-break-word w-full">
                  <p className="text-sm text-stone-500 mt-2 w-full">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-sm text-stone-500 w-full">{addr.addressLine2}</p>}
                  <p className="text-sm text-stone-500 w-full">{addr.city}, {addr.state} <span className="break-all">{addr.postalCode}</span></p>
                  <p className="text-sm text-stone-500 w-full">{addr.country}</p>
                  {addr.landmark && <p className="text-sm text-stone-400 mt-1 w-full">Landmark: {addr.landmark}</p>}
                  <p className="text-sm text-stone-500 mt-2 w-full">Phone: <span className="break-all">{addr.phone}</span></p>
                </div>
              </div>
            );
          })}

          {addresses.length === 0 && activeForm === null && (
            <div className="p-8 border border-stone-200 text-center bg-white flex flex-col items-center justify-center">
              <p className="text-sm text-stone-900 font-medium mb-1">No addresses saved yet</p>
              <p className="text-xs text-stone-500 mb-6">You need a shipping address to place an order.</p>
              <button 
                onClick={() => setActiveForm('add')}
                className="px-6 py-3 border border-stone-900 text-[10px] font-bold text-stone-900 uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-colors cursor-pointer"
              >
                + Add New Address
              </button>
            </div>
          )}

          {activeForm === 'add' && (
            <AddressForm 
              onCancel={() => setActiveForm(null)}
              onSuccess={() => {
                setActiveForm(null);
                fetchAllAddresses();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

type AddressFormProps = {
  initialData?: AddressType;
  onCancel: () => void;
  onSuccess: () => void;
};

function AddressForm({ initialData, onCancel, onSuccess }: AddressFormProps) {
  const [formData, setFormData] = useState({
    recipientName: initialData?.recipientName || '',
    phone: initialData?.phone || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'India',
    landmark: initialData?.landmark || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (initialData) {
        await updateAddress(initialData._id, formData);
      } else {
        await addAddress(formData);
      }
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 border border-stone-200 bg-stone-50 space-y-4 cursor-default w-full overflow-hidden min-w-0" onClick={e => e.stopPropagation()}>
      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-4">
        {initialData ? 'Edit Address' : 'Add New Address'}
      </h3>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 text-xs p-3 uppercase tracking-widest font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Recipient Name *</label>
          <input required type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Phone *</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
      </div>

      <div className="w-full">
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Address Line 1 *</label>
        <input required type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
      </div>

      <div className="w-full">
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Address Line 2</label>
        <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">City *</label>
          <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">State *</label>
          <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Postal Code *</label>
          <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Country *</label>
          <input required type="text" name="country" value={formData.country} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
        <div className="w-full">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Landmark</label>
          <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 bg-white" />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 sm:gap-4 pt-4">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-6 py-3 border border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-colors cursor-pointer bg-white"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}