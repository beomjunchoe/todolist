import { TodoDashboard } from "@/components/todo-dashboard";

type PageProps = {
  searchParams?: Promise<{
    auth?: string | string[];
  }>;
};

export default async function TodoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  return <TodoDashboard searchParams={params} />;
}
