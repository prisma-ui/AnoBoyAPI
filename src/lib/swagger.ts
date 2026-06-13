import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const isDist = __dirname.includes("dist");
const routesGlob = isDist
  ? path.join(__dirname, "../routes/*.js")
  : path.join(__dirname, "../routes/*.ts");

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Anoboy Scraper API",
      version: "1.0.0",
      description: "Unofficial REST API for anoboy.be",
    },
    servers: [{ url: "/" }],
  },
  apis: [routesGlob],
});
