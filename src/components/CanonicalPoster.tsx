import React from 'react';
import { Upload } from 'lucide-react';
import type { PosterContent } from '../services/posterService';

interface CanonicalPosterProps {
  content: PosterContent;
  isEditable?: boolean;
  onFieldChange?: (key: keyof PosterContent, value: string) => void;
  onImageUpload?: (key: 'diagram1' | 'diagram2' | 'diagram3', file: File) => void;
}

export const CanonicalPoster: React.FC<CanonicalPosterProps> = ({
  content,
  isEditable = false,
  onFieldChange,
  onImageUpload,
}) => {
  return (
    <div
      id="poster-print-area"
      className="w-[960px] h-[1200px] bg-white border-[24px] border-[#004182] p-8 flex flex-col justify-between shadow-2xl shrink-0 select-text relative text-left font-sans"
    >
      {/* Header Branding (Locked) */}
      <div className="flex items-center justify-between border-b-4 border-[#004182] pb-4 mb-4 select-none">
        {/* SRU Logo */}
        <div className="flex items-center gap-4">
          <img src="/poster-template/sru-logo.png" className="w-14 h-14 object-contain" alt="SRU" />
          <div>
            <h1 className="text-xl font-black text-[#004182] tracking-tight leading-none">SR UNIVERSITY</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Warangal, Telangana</p>
          </div>
        </div>

        {/* Event Title */}
        <div className="flex flex-col items-center text-center">
          <img src="/poster-template/pragathi-logo.png" className="h-8 object-contain mb-1" alt="Pragathi" />
          <h2 className="text-xl font-black text-[#004182] tracking-tight leading-none">PRAGATHI 2K26</h2>
          <p className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest mt-1">National Level Project Expo</p>
        </div>

        {/* Title Sponsor */}
        <div className="flex flex-col items-end text-right">
          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Title Sponsored By</span>
          <div className="flex items-center gap-2 mt-1">
            <img src="/poster-template/template-img8.png" className="h-7 object-contain" alt="Canara Bank" />
            <div>
              <p className="text-[10px] font-extrabold text-slate-800 leading-none">Canara Bank</p>
              <p className="text-[8px] text-slate-500 font-bold mt-0.5">Hanumakonda Branch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Title Block (Title, Members, Dept) */}
      <div className="bg-[#004182] text-white rounded-2xl p-5 mb-5 text-center shadow-md border border-[#003166]">
        {/* Project Title */}
        <div
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onFieldChange?.('projectTitle', e.target.innerText)}
          placeholder="CLICK TO ENTER PROJECT TITLE"
          className={`outline-hidden text-2xl font-black tracking-tight mb-2 uppercase min-h-[36px] ${
            isEditable ? 'focus:ring-2 focus:ring-blue-400 focus:bg-blue-950 rounded px-1' : ''
          }`}
        >
          {content.projectTitle || 'PROJECT TITLE'}
        </div>

        {/* Team Members */}
        <div className="text-sm font-bold text-blue-100 tracking-wide mb-1 flex items-center justify-center gap-1.5">
          <span>Team:</span>
          <div
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onFieldChange?.('teamMembers', e.target.innerText)}
            className={`outline-hidden min-w-[150px] ${
              isEditable ? 'focus:ring-2 focus:ring-blue-400 focus:bg-blue-950 rounded px-1' : ''
            }`}
          >
            {content.teamMembers || 'TEAM MEMBERS'}
          </div>
        </div>

        {/* Department & College Details */}
        <div
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onFieldChange?.('departmentDetails', e.target.innerText)}
          className={`outline-hidden text-xs font-semibold text-slate-300 uppercase tracking-wider min-h-[16px] ${
            isEditable ? 'focus:ring-2 focus:ring-blue-400 focus:bg-blue-950 rounded px-1' : ''
          }`}
        >
          {content.departmentDetails || 'DEPARTMENT / COLLEGE'}
        </div>
      </div>

      {/* Poster Content Grid (2 Columns) */}
      <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
        {/* LEFT Column */}
        <div className="flex flex-col gap-5">
          {/* Introduction Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex-1 flex flex-col min-h-0 shadow-2xs">
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1.5 mb-2.5">
              Introduction
            </h3>
            <div
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onFieldChange?.('introduction', e.target.innerText)}
              className={`outline-hidden text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap flex-1 text-left ${
                isEditable ? 'focus:ring-2 focus:ring-indigo-500 rounded p-1 focus:bg-white' : ''
              }`}
              placeholder={isEditable ? "Click to type project introduction and background details here…" : ""}
            >
              {content.introduction || ''}
            </div>
          </div>

          {/* Methodology Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex-1 flex flex-col min-h-0 shadow-2xs">
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1.5 mb-2.5">
              Research Objectives & Methodology
            </h3>
            <div
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onFieldChange?.('methodology', e.target.innerText)}
              className={`outline-hidden text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap flex-1 text-left ${
                isEditable ? 'focus:ring-2 focus:ring-indigo-500 rounded p-1 focus:bg-white' : ''
              }`}
              placeholder={isEditable ? "Describe research objectives, methods, and system block diagram flow here…" : ""}
            >
              {content.methodology || ''}
            </div>
          </div>
        </div>

        {/* RIGHT Column */}
        <div className="flex flex-col gap-5">
          {/* Diagrams / Configuration Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex flex-col shadow-2xs h-[450px]">
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1.5 mb-2.5">
              Configurations & Diagrams
            </h3>
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0 items-center justify-center">
              {/* Diagram 1 */}
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden group">
                  {content.diagram1 ? (
                    <img src={content.diagram1} className="w-full h-full object-contain" alt="Fig 1" />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      {isEditable ? (
                        <>
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          <span className="text-[8px] font-bold block">Upload Fig 1</span>
                        </>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-300 block">No Fig 1</span>
                      )}
                    </div>
                  )}
                  {isEditable && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageUpload?.('diagram1', file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  )}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onFieldChange?.('diagram1Caption', e.target.innerText)}
                  className={`outline-hidden text-[9px] font-bold text-slate-500 mt-1.5 text-center leading-tight min-h-[12px] min-w-[70px] ${
                    isEditable ? 'focus:ring-1 focus:ring-indigo-500 rounded px-0.5' : ''
                  }`}
                >
                  {content.diagram1Caption || 'Fig. 1. Prototype config'}
                </div>
              </div>

              {/* Diagram 2 */}
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden group">
                  {content.diagram2 ? (
                    <img src={content.diagram2} className="w-full h-full object-contain" alt="Fig 2" />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      {isEditable ? (
                        <>
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          <span className="text-[8px] font-bold block">Upload Fig 2</span>
                        </>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-300 block">No Fig 2</span>
                      )}
                    </div>
                  )}
                  {isEditable && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageUpload?.('diagram2', file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  )}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onFieldChange?.('diagram2Caption', e.target.innerText)}
                  className={`outline-hidden text-[9px] font-bold text-slate-500 mt-1.5 text-center leading-tight min-h-[12px] min-w-[70px] ${
                    isEditable ? 'focus:ring-1 focus:ring-indigo-500 rounded px-0.5' : ''
                  }`}
                >
                  {content.diagram2Caption || 'Fig. 2. System design'}
                </div>
              </div>

              {/* Diagram 3 */}
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden group">
                  {content.diagram3 ? (
                    <img src={content.diagram3} className="w-full h-full object-contain" alt="Fig 3" />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      {isEditable ? (
                        <>
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          <span className="text-[8px] font-bold block">Upload Fig 3</span>
                        </>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-300 block">No Fig 3</span>
                      )}
                    </div>
                  )}
                  {isEditable && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageUpload?.('diagram3', file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  )}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onFieldChange?.('diagram3Caption', e.target.innerText)}
                  className={`outline-hidden text-[9px] font-bold text-slate-500 mt-1.5 text-center leading-tight min-h-[12px] min-w-[70px] ${
                    isEditable ? 'focus:ring-1 focus:ring-indigo-500 rounded px-0.5' : ''
                  }`}
                >
                  {content.diagram3Caption || 'Fig. 3. Result responses'}
                </div>
              </div>
            </div>
          </div>

          {/* Conclusion & References Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex-1 flex flex-col gap-4 min-h-0 shadow-2xs">
            {/* Conclusion */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1 mb-1.5">
                Conclusion
              </h3>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onFieldChange?.('conclusion', e.target.innerText)}
                className={`outline-hidden text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap text-left ${
                  isEditable ? 'focus:ring-2 focus:ring-indigo-500 rounded p-1 focus:bg-white' : ''
                }`}
                placeholder={isEditable ? "Summarise outcomes and conclusions of your project…" : ""}
              >
                {content.conclusion || ''}
              </div>
            </div>

            {/* References */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-dashed border-slate-200 pt-2">
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest pb-1">
                References
              </h3>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onFieldChange?.('references', e.target.innerText)}
                className={`outline-hidden text-[10px] text-slate-500 leading-relaxed overflow-y-auto whitespace-pre-wrap text-left font-mono flex-1 ${
                  isEditable ? 'focus:ring-2 focus:ring-indigo-500 rounded p-1 focus:bg-white' : ''
                }`}
                placeholder={isEditable ? "1. Author, Title, Journal Name, Date…" : ""}
              >
                {content.references || ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Sponsors Banner (Locked) */}
      <div className="border-t-4 border-[#004182] pt-3 mt-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Our Sponsors:</span>
          <div className="flex items-center gap-4 flex-wrap">
            <img src="/poster-template/template-img4.png" className="h-5 object-contain grayscale opacity-75" alt="s1" />
            <img src="/poster-template/template-img5.png" className="h-5 object-contain grayscale opacity-75" alt="s2" />
            <img src="/poster-template/template-img6.png" className="h-5 object-contain grayscale opacity-75" alt="s3" />
            <img src="/poster-template/template-img7.png" className="h-5 object-contain grayscale opacity-75" alt="s4" />
            <img src="/poster-template/template-img8.png" className="h-5 object-contain grayscale opacity-75" alt="s5" />
            <img src="/poster-template/template-img9.png" className="h-5 object-contain grayscale opacity-75" alt="s6" />
          </div>
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
          PRAGATHI 2K26 · SR University
        </div>
      </div>
    </div>
  );
};
