import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useMutation } from "convex/react";

// Define the expected shape of the 'dream' prop based on the schema
type Dream = {
  _id: Id<"dreams">;
  content: string;
  story?: string; // The generated story
  status?: "pending" | "storified"; // To track AI processing
  analysis?: { // Add optional analysis object
    title?: string; // Add optional title field
    // Add other potential analysis fields for dreams later if needed
  };
};

type DreamCardProps = {
  dream: Dream;
  onDelete: (id: Id<"dreams">) => void;
  onFocus: () => void;
  isHidden: boolean;
};

export function DreamCard({ dream, onDelete, onFocus, isHidden }: DreamCardProps) {
  return (
    <div
      key={dream._id}
      className={`relative bg-white rounded-xl p-6 shadow-md overflow-hidden border border-border-grey ${isHidden ? 'invisible' : 'transition-all duration-300'}`}
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={() => onDelete(dream._id)}
        className="absolute top-3 right-3 p-1 rounded text-dark-grey-text hover:text-red-600 hover:bg-red-100 transition-colors"
        title="Delete Dream"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center mb-4 text-dark-grey-text text-sm border-b border-gray-200 pb-3 mb-3">
        {'< Dream'}
      </div>

      {/* Content - Make clickable for expansion */}
      <div className="cursor-pointer" onClick={onFocus}>
        {dream.status === "pending" ? (
          <div className="flex items-center gap-2 text-dark-grey-text">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-grey-text"></div>
            Generating story...
          </div>
        ) : dream.story || dream.analysis?.title ? ( // Render if story or title exists
          <div className="space-y-3">
            {/* Title or Dream Content */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <span className="text-lg text-dark-grey-text font-semibold">{dream.analysis?.title}</span>
              {/* Optional: Add a score/status indicator here if applicable to dreams */}
            </div>
            {/* Story Snippet */}
            {dream.story && (
              <p className="text-sm text-dark-grey-text mt-2 line-clamp-3">
                {dream.story}
              </p>
            )}
          </div>
        ) : (
          // Fallback if storified but no story or title data somehow
          <p className="text-dark-grey-text">Story or analysis data unavailable.</p>
        )}
      </div>

      {/* Optional: Add a "View Story" button here if needed, but onFocus handles viewing */}

    </div>
  );
}