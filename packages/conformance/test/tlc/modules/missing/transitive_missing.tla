(*---
description: A module missing from an extended file is rejected.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
includes: [FixImportsMissing.tla]
outcome: parse-error
---*)
---- MODULE transitive_missing ----
EXTENDS FixImportsMissing
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file transitive_missing
    | In module FixImportsMissing
    | Cannot find source file for module NoSuchModuleB imported in module FixImportsMissing.
    | *** Errors: 1
    | In module FixImportsMissing
    | Cannot find source file for module NoSuchModuleB imported in module FixImportsMissing.
    3002:1 Parsing or semantic analysis failed.
---*)
