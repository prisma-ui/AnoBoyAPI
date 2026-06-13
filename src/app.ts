import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./lib/swagger";
import animeRouter from "./routes/anime";
import genresRouter from "./routes/genres";
import searchRouter from "./routes/search";
import azlistRouter from "./routes/azlist";
import animeDetailRouter from "./routes/animeDetail";
import episodeRouter from "./routes/episode";
import homeRouter from "./routes/home";
import filterRouter from "./routes/filter";

const app = express();

app.use(cors());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/home", homeRouter);
app.use("/api/filter", filterRouter);
app.use("/api/anime", animeRouter);
app.use("/api/genres", genresRouter);
app.use("/api/search", searchRouter);
app.use("/api/az-list", azlistRouter);
app.use("/api/anime", animeDetailRouter);
app.use("/api/episode", episodeRouter);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Anoboy API running", docs: "/docs" });
});

export default app;
