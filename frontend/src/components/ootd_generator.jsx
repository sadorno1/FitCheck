import React from 'react';

export default function OOTDGeneratorPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-20 bg-gray-100 p-4 border-r border-dashed">
        <div className="mb-6 border border-dashed rounded p-2 text-center font-bold text-xs">
          FITCHECK
        </div>
        <div className="flex flex-col items-center space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-8 h-8 border border-dashed rounded"></div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 border border-dashed">
        <div className="grid grid-cols-3 gap-4">
          {/* OOTD Generator Header */}
          <div className="col-span-2 border border-dotted rounded p-4 text-center font-semibold">
            OOTD Generator
          </div>
          
          {/* Closet outfit */}
          <div className="row-span-2 border border-dotted rounded p-4 text-center font-semibold">
            Closet outfit
          </div>

          {/* Outfit Generated Box */}
          <div className="col-span-2 border border-dotted rounded p-8 text-center text-xl font-bold">
            OUTFIT GENERATED
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button className="w-24 h-24 rounded-full border border-dotted text-sm font-medium">
            TRY ANOTHER
          </button>
          <button className="w-24 h-24 rounded-full border border-dotted text-sm font-medium">
            SAVE
          </button>
        </div>
      </main>
    </div>
  );
}
