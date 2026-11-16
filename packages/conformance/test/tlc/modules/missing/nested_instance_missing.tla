(*---
description: "A nested module's INSTANCE of a missing module is rejected."
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE nested_instance_missing ----
---- MODULE I ----
INSTANCE NoSuchModule
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file nested_instance_missing
    | In module I
    | Cannot find source file for module NoSuchModule imported in module I.
    | *** Errors: 1
    | In module I
    | Cannot find source file for module NoSuchModule imported in module I.
    3002:1 Parsing or semantic analysis failed.
---*)
