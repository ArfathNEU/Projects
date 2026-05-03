import PrimitiveGrid from './sub/PrimitiveGrid';

export default function AssetPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-[#2a2a3e]">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Assets</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <PrimitiveGrid />
      </div>
    </div>
  );
}
