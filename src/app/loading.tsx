import { LoadingSpinner } from "@/components/core/loading-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
    </div>
  );
}
