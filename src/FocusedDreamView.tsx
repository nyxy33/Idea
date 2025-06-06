import React, { useState, useEffect, useRef } from 'react';
import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useAction, useMutation } from 'convex/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // Reusing this for regenerate

// Define the expected shape of the 'dream' prop based on the schema
// Define the expected shape of the 'dream' prop based on the schema
interface Dream {
  _id: Id<"dreams">;
  content: string;
  story?: string; // The generated story
  status?: "pending" | "storified"; // To track AI processing
  analysis?: { // Add optional analysis object
    title?: string; // Add optional title field
    // Add other potential analysis fields for dreams later if needed
  };
}

type FocusedDreamViewProps = {
  focusedDream: Dream;
  allDreams: Dream[]; // Needed to find index for navigation disabling
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const ZOOM_LEVELS = [0.5, 1.0, 1.5, 2.0, 2.5];
const SCROLL_SENSITIVITY = 0.15;

export function FocusedDreamView({ focusedDream, allDreams, onClose, onNavigate }: FocusedDreamViewProps) {
  // Find current index to disable navigation buttons if needed
  const currentIndex = allDreams.findIndex(dream => dream._id === focusedDream._id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allDreams.length - 1;

  // State for scaling/zooming and editing
  const [scale, setScale] = useState(1);
  const [zoomPercentage, setZoomPercentage] = useState(100); // State for displayed zoom percentage
  const [fontSize, setFontSize] = useState('text-base'); // State for font size (can be adapted if needed)
  const [isEditing, setIsEditing] = useState(false); // State for editing mode
  const [editedContent, setEditedContent] = useState(focusedDream.content); // State for edited dream content
  const [zoomBarHeightClass, setZoomBarHeightClass] = useState('h-4'); // State for zoom bar height (can be removed if not used)
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card element
  const zoomControlRef = useRef<HTMLDivElement>(null); // Ref for the zoom control element
  const [cardMaxHeight, setCardMaxHeight] = useState<number | null>(null); // State for dynamic max height
  const [isAnimatingIn, setIsAnimatingIn] = useState(false); // State for animation
  const [isBackdropVisible, setIsBackdropVisible] = useState(false); // State for backdrop transition

  // Convex actions/mutations for dreams
  const generateStory = useAction(api.dreamStorytelling.generateStory); // Action to generate story
  const updateDreamContent = useMutation(api.dreams.updateDreamContent); // Mutation to update dream content

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = ''; // Reset to default
      document.body.style.width = ''; // Reset to default
    };
  }, []);

  // Effect to handle backdrop transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBackdropVisible(true);
    }, 50);
    return () => {
      setIsBackdropVisible(false);
      clearTimeout(timer);
    };
  }, []);

  // Update edited content if the focused dream changes
  useEffect(() => {
      setEditedContent(focusedDream.content);
      setIsEditing(false); // Reset editing state when dream changes
  }, [focusedDream.content, focusedDream._id]);


  // Effect to calculate and set max height based on width and viewport height
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (cardRef.current) {
        const viewportHeight = window.innerHeight;
        // Max height is 85% of the viewport height
        setCardMaxHeight(viewportHeight * 0.85);
      }
    };

    calculateMaxHeight(); // Calculate on mount
    window.addEventListener('resize', calculateMaxHeight); // Recalculate on resize

    return () => {
      window.removeEventListener('resize', calculateMaxHeight); // Clean up event listener
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Effect to handle wheel zoom on the zoom control element
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent default scroll behavior
      e.stopPropagation(); // Prevent backdrop click
      const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY; // Determine zoom direction and step
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
      setZoomPercentage(Math.round(newScale * 100));
    };

    if (zoomControlRef.current) {
      zoomControlRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (zoomControlRef.current) {
        zoomControlRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scale]); // Add scale to dependency array

  // Effect to handle the mounting/unmounting animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimatingIn(true);
    }, 50);
    return () => {
      setIsAnimatingIn(false);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
    <div
      id="focused-dream-backdrop" // Updated ID
      className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-all duration-500 ease-in-out ${isBackdropVisible ? 'bg-opacity-[0.2] backdrop-blur-sm' : 'bg-opacity-0 backdrop-blur-none'}`}
      onClick={onClose} // Close when clicking the backdrop
      style={{ perspective: '1000px' }}
    >
      {/* Outer Scrollable Container */}
      <div
        ref={cardRef} // Attach the ref
        className="relative bg-white rounded-xl max-w-2xl w-full overflow-y-auto hide-scrollbar border-2 border-border-grey min-h-0"
        style={{
           boxShadow: isAnimatingIn ? '0 50px 75px -20px rgba(0, 0, 0, 0.3)' : 'none', // Adjust or remove glow for dreams
           transform: `scale(${scale}) ${isAnimatingIn ? 'translateZ(0px)' : 'translateZ(-180px)'}`,
           transformOrigin: 'center',
           transformStyle: 'preserve-3d',
           backfaceVisibility: 'hidden',
           transition: 'transform 0.15s ease-out, box-shadow 0.18s ease-out',
           maxHeight: cardMaxHeight !== null ? `${cardMaxHeight}px` : undefined,
           maxWidth: 'calc(48rem * 1.3)',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent closing when clicking inside the card
      >
        {/* Inner Content Div - Apply scale transform here */}
        <div
          className={`pt-4 pb-7 pl-7 pr-7 ${fontSize}`}
          style={{ fontSize: '1.3rem', transform: 'translateZ(0)', textRendering: 'optimizeLegibility' }}
        >
        {/* Card Content */}
        {focusedDream.status === "pending" && (
          <div className="flex items-center justify-center gap-2 text-dark-grey-text py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dark-grey-text"></div>
            Generating story...
          </div>
        )}

        {focusedDream.status !== "pending" && (
          <div className="space-y-4">
            {/* Header: Dream Title (using first few words or a generated title if we add one later) */}
            <div className="border-b border-gray-200 pb-3 mb-3">
              {/* Display AI Title if available, otherwise a default */}
              <span className="text-2xl text-dark-grey-text font-semibold">
                {focusedDream.analysis?.title || 'Dream Details'} {/* Use AI title or default */}
              </span>
            </div>

            {/* Detailed Content */}
            <div className="space-y-3">
               {isEditing ? (
                 <textarea
                   value={editedContent}
                   onChange={(e) => setEditedContent(e.target.value)}
                   className="w-full p-2 border rounded text-dark-grey-text min-h-[150px]" // Added min-height
                   rows={6} // Adjust rows as needed
                   autoFocus // Focus the textarea when editing starts
                 />
               ) : (
                 <p className="text-dark-grey-text italic whitespace-pre-wrap">{focusedDream.content}</p>
               )}
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-xl text-dark-grey-text text-lg font-semibold">Generated Story:</span>
                 {focusedDream.story ? (
                   <p className="text-dark-grey-text mt-1 whitespace-pre-wrap">{focusedDream.story}</p>
                 ) : (
                   <p className="text-gray-500 mt-1">Story not yet generated or failed.</p>
                 )}
               </div>
            </div>
          </div>
        )}

        {focusedDream.status !== "pending" && !focusedDream.story && (
           <p className="text-dark-grey-text text-center py-10">Story generation failed or is not available.</p>
        )}


      </div> {/* End of inner scaled content div */}
      </div> {/* End of outer scrollable container div */}

      {/* Toolbars Container (Centered Group) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
        {/* Main Toolbar Container */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          {/* Left Arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            disabled={isFirst}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Previous Dream" // Updated title
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
             </svg>
          </button>
          {/* Right Arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            disabled={isLast}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Next Dream" // Updated title
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
             </svg>
          </button>
          {/* Zoom Control */}
          <div
            ref={zoomControlRef} // Attach the ref
            className="flex items-center text-dark-grey-text cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = ZOOM_LEVELS.indexOf(scale);
              const nextIndex = (currentIndex + 1) % ZOOM_LEVELS.length;
              const newScale = ZOOM_LEVELS[nextIndex];
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
            onWheel={(e) => {
              e.preventDefault(); // Prevent default scroll behavior
              e.stopPropagation(); // Prevent backdrop click
              const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY; // Determine zoom direction and step
              const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
            title="Adjust Zoom (Click to snap, Scroll to fine-tune)"
          >
            <span className="font-semibold">{zoomPercentage}%</span>
          </div>
          {/* Edit Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title={isEditing ? "Cancel Edit" : "Edit Dream"} // Updated title
          >
            {isEditing ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
               </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            )}
          </button>
          {/* Save Button (only visible when editing) */}
          {isEditing && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await updateDreamContent({ dreamId: focusedDream._id, content: editedContent });
                  setIsEditing(false); // Exit editing mode after saving
                } catch (error) {
                   console.error("Failed to save dream:", error);
                   // Optionally: show an error message to the user
                }
              }}
              className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
              title="Save Changes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
          )}
          {/* Regenerate Story Button */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (isEditing) setIsEditing(false); // Exit edit mode if regenerating
              try {
                  // The updateDreamContent mutation already sets status to pending and schedules generation
                  // If not editing, we just need to trigger the action directly or call a mutation that does it
                  // For simplicity, let's call the action directly here.
                  // A more robust approach might be a dedicated mutation like updateDreamStatus to pending
                  // and then scheduling the action, similar to reanalyzeIdea.
                  // For now, direct action call:
                   generateStory({ dreamId: focusedDream._id }); // Trigger story generation action
              } catch(error) {
                  console.error("Failed to trigger story regeneration:", error);
              }
            }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Regenerate Story" // Updated title
          >
             <ArrowPathIcon className="w-6 h-6" /> {/* Using the same icon */}
          </button>
        </div>
      </div> {/* End of toolbars container */}

    </div> {/* End of backdrop div */}
</>
);
}