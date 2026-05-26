import Container from "./ui/Container";
import ContactButton from "@/components/ui/ContactButton";

export default function Connect() {
  return (
    <div className="bg-card">
      <Container
        className={`flex flex-col items-center justify-between gap-6 py-12 text-center md:text-left`}>
        <h3 className="text-foreground text-3xl lg:text-5xl uppercase font-normal">
          Ready To Start?
        </h3>
        <ContactButton location="ready_to_start">Let's Talk</ContactButton>
      </Container>
    </div>
  );
}
