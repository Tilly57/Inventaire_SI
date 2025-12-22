import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    provider: "postgresql",
    url: "postgresql://inventaire:inventaire_pwd@localhost:5432/inventaire"
  }
});
