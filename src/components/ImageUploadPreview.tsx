interface ImageUploadPreviewProps {
  previewUrl: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageUploadPreview({ previewUrl, onImageUpload }: ImageUploadPreviewProps) {
  return (
    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
      {previewUrl ? (
        <div className="relative w-full h-full">
          <img
            src={previewUrl}
            alt="Profile preview"
            className="absolute inset-0 w-full h-full object-cover rounded-full"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-8 h-8 mb-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className="mb-2 text-xs text-gray-500 text-center">
            Add Photo
          </p>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={onImageUpload}
      />
    </label>
  );
} 