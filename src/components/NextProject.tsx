import Container from "./ui/Container";
import ArrowButton from "./ui/ArrowButton";
import Link from "next/link";

interface NextProjectProps {
  prevProject?: {
    title: string;
    slug: string;
  } | null;
  nextProject?: {
    title: string;
    slug: string;
  } | null;
}

export default function NextProject({
  prevProject,
  nextProject,
}: NextProjectProps) {
  return (
    <div className="bg-card mt-20">
      <Container className="flex flex-row items-center justify-center gap-6 py-12 text-center">
        {prevProject && (
          <div className="flex-1 flex flex-col items-center">
            <h3 className="text-foreground text-2xl lg:text-4xl mb-4 text-center">
              {prevProject.title}
            </h3>
            <ArrowButton
              href={`/projects/${prevProject.slug}`}
              direction="left">
              Previous
            </ArrowButton>
          </div>
        )}
        <div className="w-[3px] h-40 relative shrink-0">
          <div className="absolute top-0 bottom-0 left-0 w-px bg-border/40" />
          <div className="absolute top-0 bottom-0 left-px w-[1.5px] bg-white" />
        </div>
        {nextProject && (
          <div className="flex-1 flex flex-col items-center">
            <h3 className="text-foreground text-2xl lg:text-4xl mb-4 text-center">
              {nextProject.title}
            </h3>

            <ArrowButton href={`/projects/${nextProject.slug}`}>
              Next
            </ArrowButton>
          </div>
        )}
      </Container>
    </div>
  );
}
