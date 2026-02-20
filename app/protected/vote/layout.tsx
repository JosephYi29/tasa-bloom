export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[1600px] mx-auto w-full">
      {children}
    </div>
  );
}
