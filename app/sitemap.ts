import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/apply", "/application-status", "/login", "/programs/genz-builder", "/programs/solo-founder", "/programs/sales-mastery-live-fellowship", "/academies/startup-skool", "/contact", "/privacy"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : path === "/apply" ? 0.9 : 0.6
  }));
}
