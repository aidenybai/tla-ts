(*---
description: An unnamed INSTANCE of a missing module is rejected.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE instance_missing ----
INSTANCE NoSuchModule
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file instance_missing
    | In module instance_missing
    | Cannot find source file for module NoSuchModule imported in module instance_missing.
    | *** Errors: 1
    | In module instance_missing
    | Cannot find source file for module NoSuchModule imported in module instance_missing.
    3002:1 Parsing or semantic analysis failed.
---*)
