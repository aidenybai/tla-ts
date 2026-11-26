// Writes, as JSON at the path given, the host that a browser prepares JS.tla's runtime from: the
// texts of JS.tla's directory given, the realm of the Node that runs this, and the runtime's
// graph. The realm is the host's, so this runs on Node, with a stack deep enough to start it.
import { writeFileSync } from "node:fs";
import { recordJsTlaHost } from "../src/typescript/spec/prepare";

writeFileSync(process.argv[3], JSON.stringify(recordJsTlaHost(process.argv[2])));
