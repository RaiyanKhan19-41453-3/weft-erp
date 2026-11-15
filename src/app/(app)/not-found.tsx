import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";

export default function AppNotFound() {
  return (
    <Card className="mx-auto max-w-xl">
      <EmptyState
        icon={<SearchX />}
        title="That page was not found"
        description="Check the URL or start again from the operations overview."
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/orders">Purchase orders</Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/">Overview</Link>
            </Button>
          </div>
        }
      />
    </Card>
  );
}
