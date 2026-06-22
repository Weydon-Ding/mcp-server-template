export * from "./add.js";
export * from "./echo.js";

import { addTool, runAdd } from "./add.js";
import { echoTool, runEcho } from "./echo.js";

export const domainTools = [
  {
    ...echoTool,
    run: runEcho,
  },
  {
    ...addTool,
    run: runAdd,
  },
] as const;
