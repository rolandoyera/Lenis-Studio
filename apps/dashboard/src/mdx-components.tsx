import type { MDXComponents } from "mdx/types";

import { MdxCodeBlock } from "@/components/ui/mdx-code-block";
import { H1, H2, H3 } from "@/components/ui/typography";

/**
 * Maps raw MDX elements onto our design-system components so authored `.mdx`
 * docs match the rest of the app. Next.js picks this file up automatically.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <H1 className="mt-2">{children}</H1>,
    h2: ({ children }) => <H2 className="mt-8 mb-1">{children}</H2>,
    h3: ({ children }) => <H3 className="mt-6 mb-1">{children}</H3>,
    p: ({ children }) => (
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="ml-6 list-disc text-sm text-muted-foreground [&>li]:mt-1.5">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="ml-6 list-decimal text-sm text-muted-foreground [&>li]:mt-1.5">
        {children}
      </ol>
    ),
    a: ({ children, href }) => (
      <a href={href} className="text-primary hover:underline">
        {children}
      </a>
    ),
    code: ({ children, ...props }) =>
      // Inline code arrives as a plain string; highlighted block code arrives as
      // pre-styled <span> elements from rehype-pretty-code (pass those through).
      typeof children === "string" ? (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
          {children}
        </code>
      ) : (
        <code {...props}>{children}</code>
      ),
    // Background/token colors come from rehype-pretty-code's inline styles;
    // MdxCodeBlock owns layout (padding, rounding, scroll) plus the copy button.
    pre: (props) => <MdxCodeBlock {...props} />,
    hr: () => <hr className="my-6 border-border" />,
    ...components,
  };
}
