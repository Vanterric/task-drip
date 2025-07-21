export function DotLoader() {
  return (
    <div className="flex gap-[2px]">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-[4px] h-[4px] rounded-full bg-white animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
