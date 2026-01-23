import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
          <Skeleton className="h-5 w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                {i < 5 && <Skeleton className="h-0.5 flex-1 mx-1" />}
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-4 w-28 mt-2" />
      </CardContent>
    </Card>
  );
}
