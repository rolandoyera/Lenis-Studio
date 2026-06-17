import type { ReactNode } from "react";

import { H1, P } from "@/components/ui/typography";

interface PageHeaderProps {
  title: string;
  description: string;
  titleAccessory?: ReactNode;
}

export default function PageHeader({ title, description, titleAccessory }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <H1>{title}</H1>
        {titleAccessory}
      </div>
      <P>{description}</P>
    </div>
  );
}
