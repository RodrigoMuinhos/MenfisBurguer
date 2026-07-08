import { StaticImageData } from "next/image";

export type ProductCategory = "burger" | "combo" | "bebida" | "extra" | "fries";

export type MenuItem = {
  id: string;
  name: string;
  eyebrow: string;
  desc: string;
  price: number;
  originalPrice?: number;
  image?: StaticImageData | string;
  tags: string[];
  category: ProductCategory;
  highlight?: boolean;
};
