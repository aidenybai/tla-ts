(*---
description: A LOCAL INSTANCE of a missing module is rejected.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE local_instance_missing ----
LOCAL INSTANCE NoSuchModule
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file local_instance_missing
    | In module local_instance_missing
    | Cannot find source file for module NoSuchModule imported in module local_instance_missing.
    | *** Errors: 1
    | In module local_instance_missing
    | Cannot find source file for module NoSuchModule imported in module local_instance_missing.
    3002:1 Parsing or semantic analysis failed.
---*)
