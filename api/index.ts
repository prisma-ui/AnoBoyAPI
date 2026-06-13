import app from "../src/app";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default (req: VercelRequest, res: VercelResponse) => {
  // @ts-ignore - express app is a request handler
  return app(req, res);
};
