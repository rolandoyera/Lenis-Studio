import { H1, P } from "@/components/ui/typography";

interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <H1>{title}</H1>
      <P>{description}</P>
    </div>
  );
}
