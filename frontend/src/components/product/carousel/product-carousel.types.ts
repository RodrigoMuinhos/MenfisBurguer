export type CarouselVariant = "hero" | "ingredients" | "combo" | "closeup" | "cta";

export type CarouselAction = "add-to-cart" | "open-product" | "open-site";

export type CarouselSlide = {
  id: number;
  productId?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  imageAlt: string;
  variant: CarouselVariant;
  features?: string[];
  showPrice?: boolean;
  primaryAction?: { label: string; action: CarouselAction };
  secondaryAction?: { label: string; href: string };
};
