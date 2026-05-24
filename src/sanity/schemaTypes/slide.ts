import { defineType, defineField } from "sanity";

export default defineType({
  name: "slide",
  title: "Homepage Slide",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Slide Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Slide Description",
      type: "text",
    }),
    defineField({
      name: "image",
      title: "Slide Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alt Text",
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "buttonText",
      title: "Button Text",
      type: "string",
      initialValue: "Explore Now",
    }),
    defineField({
      name: "project",
      title: "Link to Project",
      type: "reference",
      to: [{ type: "project" }],
      description: "Select the project this slide links to (updates slug automatically)",
    }),
    defineField({
      name: "order",
      title: "Order Weight",
      type: "number",
      description: "Order rank (e.g. 1, 2, 3...)",
    }),
  ],
  orderings: [
    {
      title: "Manual Sorting Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
  },
});
