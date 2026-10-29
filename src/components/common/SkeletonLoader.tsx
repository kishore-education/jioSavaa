import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#181818] p-3.5 rounded-lg animate-pulse flex flex-col">
      <div className="w-full aspect-square bg-[#282828] rounded-md mb-3" />
      <div className="h-4 bg-[#282828] rounded w-3/4 mb-2" />
      <div className="h-3 bg-[#282828] rounded w-1/2" />
    </div>
  );
};

export const SongRowSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-12 items-center gap-4 px-4 py-2.5 rounded-md animate-pulse">
      <div className="col-span-1 h-4 w-4 bg-[#282828] rounded" />
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#282828] rounded flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-[#282828] rounded w-3/4" />
          <div className="h-3 bg-[#282828] rounded w-1/2" />
        </div>
      </div>
      <div className="hidden sm:block col-span-3 h-3 bg-[#282828] rounded w-2/3" />
      <div className="col-span-6 sm:col-span-3 flex justify-end gap-3">
        <div className="h-4 w-4 bg-[#282828] rounded-full" />
        <div className="h-3 w-8 bg-[#282828] rounded" />
      </div>
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-end gap-6 p-6 sm:p-8 animate-pulse bg-gradient-to-b from-[#2a2a2a] to-[#121212]">
      <div className="w-44 h-44 sm:w-52 sm:h-52 bg-[#333333] rounded-md shadow-2xl flex-shrink-0" />
      <div className="space-y-3 flex-1 w-full">
        <div className="h-4 bg-[#333333] rounded w-24" />
        <div className="h-10 sm:h-14 bg-[#333333] rounded w-3/4" />
        <div className="h-4 bg-[#333333] rounded w-1/2" />
      </div>
    </div>
  );
};

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

