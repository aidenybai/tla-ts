// Writes, as JSON at the path given, the host that a browser prepares ESCore's runtime from: the
// texts of the ESCore directory given, the realm of the Node that runs this, and the runtime's
// graph. The realm is the host's, so this runs on Node, with a stack deep enough to start it.
import { writeFileSync } from "node:fs";
import { recordEscoreHost } from "../src/typescript/spec/prepare";

writeFileSync(process.argv[3], JSON.stringify(recordEscoreHost(process.argv[2])));
