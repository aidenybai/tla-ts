import { delimiter } from "node:path";
import { getTlcVersion } from "../tlc/version";
import { getToolsJar, reportErrors, type JavaProperties } from "./shared";
import { runTlapm } from "./tlapm";
import { checkSpecs } from "./tlc";
import { exportXml, exportXml174 } from "./xml-exporter";

// Tools that run TLC with Java, such as pstack's statechart skill, can run tla-ts in place of java,
// as in `tla-ts -DTLA-Library=lib -cp tla2tools.jar tlc2.TLC Spec`. Other JVM options are ignored.
const JAVA_MAIN_CLASSES = ["tlc2.TLC", "tla2sany.xml.XMLExporter"];

const TLA_LIBRARY_PROPERTY = "-DTLA-Library=";

const TEMPORARY_DIRECTORY_PROPERTY = "-Djava.io.tmpdir=";

const TLC_VERSION_PROPERTY = "-Dtla-ts.tlc=";

const getJavaLaunch = (args: string[]) => {
  const java: JavaProperties = { libraries: [] };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "-cp" || arg === "-classpath" || arg === "--class-path") {
      index++;
      java.classPath = args[index];
    } else if (arg === "-jar") {
      java.classPath = args[index + 1];
      return { mainClass: "tlc2.TLC", args: args.slice(index + 2), java };
    } else if (arg.startsWith(TLA_LIBRARY_PROPERTY)) {
      java.libraries.push(...arg.slice(TLA_LIBRARY_PROPERTY.length).split(delimiter));
    } else if (arg.startsWith(TEMPORARY_DIRECTORY_PROPERTY)) {
      java.temporaryDirectory = arg.slice(TEMPORARY_DIRECTORY_PROPERTY.length);
    } else if (arg.startsWith(TLC_VERSION_PROPERTY)) {
      java.tlcVersion = arg.slice(TLC_VERSION_PROPERTY.length) === "1.7.4" ? "1.7.4" : "master";
    } else if (!arg.startsWith("-D") && !arg.startsWith("-X")) {
      const isLaunch = index > 0 || JAVA_MAIN_CLASSES.includes(arg);
      return isLaunch ? { mainClass: arg, args: args.slice(index + 1), java } : undefined;
    }
  }
  return undefined;
};

const run = async (args: string[]) => {
  if (args[0] === "tlapm") return reportErrors(() => runTlapm(args.slice(1)));
  const launch = getJavaLaunch(args);
  if (launch === undefined) return checkSpecs(args, { libraries: [] });
  launch.java.tlcVersion ??= await getTlcVersion(getToolsJar(launch.java));
  if (launch.mainClass === "tlc2.TLC") return checkSpecs(launch.args, launch.java);
  if (launch.mainClass === "tla2sany.xml.XMLExporter") {
    return reportErrors(() =>
      launch.java.tlcVersion === "1.7.4"
        ? exportXml174(launch.args, getToolsJar(launch.java))
        : exportXml(launch.args),
    );
  }
  console.error(
    `Error: tla-ts runs the Java classes ${JAVA_MAIN_CLASSES.join(" and ")}, not ${launch.mainClass}.`,
  );
  return 1;
};

export const runCli = async () => {
  process.exitCode = await run(process.argv.slice(2));
};
