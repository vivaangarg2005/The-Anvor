'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cropper, { Area } from 'react-easy-crop';
import { uploadProfilePhoto, deleteProfilePhoto } from '../lib/api';
import getCroppedImg from '../lib/cropImage';

interface Props {
  initialUrl: string | null;
  userName: string;
}

/**
 * Generates 1–2 uppercase initials from a name string.
 */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfilePhotoUploader({ initialUrl, userName }: Props) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side pre-validation
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      setError('Unsupported file type. Please use JPEG, PNG, or WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleCropSubmit = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    const prevSrc = cropImageSrc;
    // Hide cropper immediately
    setCropImageSrc(null);

    try {
      const croppedFile = await getCroppedImg(prevSrc, croppedAreaPixels);
      if (!croppedFile) {
        throw new Error('Failed to crop image.');
      }

      const result = await uploadProfilePhoto(croppedFile);
      if (result.success && result.data?.profileImageUrl) {
        // Append timestamp to bust browser cache since the base URL doesn't change
        setPhotoUrl(`${result.data.profileImageUrl}?t=${Date.now()}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(prevSrc);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelCrop = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async () => {
    if (!photoUrl) return;
    setError('');
    setIsUploading(true);
    try {
      await deleteProfilePhoto();
      setPhotoUrl(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const initials = getInitials(userName);

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          aria-label={photoUrl ? 'Change profile photo' : 'Upload profile photo'}
          className="relative group w-20 h-20 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0 focus:outline-none"
          disabled={isUploading}
        >
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photoUrl.includes('?') ? `${photoUrl}&tr=w-160,h-160` : `${photoUrl}?tr=w-160,h-160`}
              alt={`${userName}'s profile photo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-lg font-serif font-bold text-stone-600 select-none">
              {initials || '?'}
            </span>
          )}

          {/* Hover overlay */}
          <span className={`absolute inset-0 bg-stone-900/40 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isUploading ? (
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </span>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
          aria-label="Select profile photo"
        />

        {/* Actions */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-[10px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-900 hover:text-stone-500 hover:border-stone-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Add Photo'}
          </button>

          {photoUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-[10px] text-stone-400 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-600 text-center max-w-[180px]">{error}</p>
        )}
      </div>

      {/* Cropper Modal Overlay */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 md:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-[540px] h-[min(580px,calc(100dvh-2rem))] bg-white rounded-xl md:rounded-2xl overflow-hidden flex flex-col shadow-2xl my-auto">
            
            {/* Header */}
            <div className="flex items-center px-4 h-14 border-b border-stone-100 shrink-0 bg-white z-10 gap-2">
              {/* Cancel — fixed width so title has room */}
              <button 
                onClick={handleCancelCrop} 
                className="shrink-0 p-2 -ml-2 text-stone-500 hover:text-stone-900 transition-colors focus:outline-none"
                aria-label="Cancel crop"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Title — takes remaining space, truncates if needed */}
              <h3 className="flex-1 min-w-0 text-center text-sm md:text-base font-medium text-stone-900 truncate">
                Drag the image to adjust
              </h3>
              
              {/* Upload — fixed width */}
              <button 
                onClick={handleCropSubmit} 
                className="shrink-0 text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors focus:outline-none px-2 py-1"
              >
                Upload
              </button>
            </div>
            
            {/* Cropper Area */}
            <div className="relative flex-1 min-h-0 bg-stone-900">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="horizontal-cover"
              />

              {/* Zoom controls float */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col bg-white rounded-full p-1 shadow-lg border border-stone-100 z-10">
                <button 
                  onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-600 hover:text-stone-900 focus:outline-none hover:bg-stone-50 rounded-full transition-colors"
                  aria-label="Zoom In"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 6v12M6 12h12" /></svg>
                </button>
                <div className="h-px w-5 sm:w-6 bg-stone-200 mx-auto"></div>
                <button 
                  onClick={() => setZoom(z => Math.max(z - 0.1, 1))}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-600 hover:text-stone-900 focus:outline-none hover:bg-stone-50 rounded-full transition-colors"
                  aria-label="Zoom Out"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 12h12" /></svg>
                </button>
              </div>

              {/* Footer Floating Checkmark */}
              <div className="absolute bottom-5 right-5 z-10">
                <button 
                  onClick={handleCropSubmit} 
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center rounded-full shadow-[0_8px_16px_rgba(16,185,129,0.35)] transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                  aria-label="Confirm crop and upload"
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* White bottom bar */}
            <div className="h-8 sm:h-10 bg-white shrink-0"></div>
          </div>
        </div>
      )}
    </>
  );
}
