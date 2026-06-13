import swaggerJsdoc from "swagger-jsdoc";

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
  apis: ["./src/routes/*.ts"],
});
