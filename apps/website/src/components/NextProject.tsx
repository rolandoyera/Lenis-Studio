import Container from "./ui/Container";
import ArrowButton from "./ui/ArrowButton";

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
      <Container className="flex flex-row items-stretch justify-center gap-6 py-12 text-center">
        {prevProject && (
          <div className="flex-1 flex flex-col items-center justify-between">
            <h3 className="text-foreground text-2xl lg:text-4xl mb-4 text-center flex-1 flex items-center justify-center">
              {prevProject.title}
            </h3>
            <ArrowButton
              href={`/projects/${prevProject.slug}`}
              direction="left"
              variant="secondary">
              Previous
            </ArrowButton>
          </div>
        )}
        <div className="w-[3px] relative shrink-0 self-center h-40">
          <div className="absolute top-0 bottom-0 left-0 w-px bg-border/40" />
          <div className="absolute top-0 bottom-0 left-px w-[1.5px] bg-white/80" />
        </div>
        {nextProject && (
          <div className="flex-1 flex flex-col items-center justify-between">
            <h3 className="text-foreground text-2xl lg:text-4xl mb-4 text-center flex-1 flex items-center justify-center">
              {nextProject.title}
            </h3>

            <ArrowButton
              href={`/projects/${nextProject.slug}`}
              variant="secondary">
              Next
            </ArrowButton>
          </div>
        )}
      </Container>
    </div>
  );
}
