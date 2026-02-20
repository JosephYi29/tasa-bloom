export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {children}
    </div>
  );
}
