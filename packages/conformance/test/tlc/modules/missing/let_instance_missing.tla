(*---
description: A LET INSTANCE of a missing module is rejected before evaluation.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE let_instance_missing ----
A == LET M == INSTANCE NoSuchModule IN 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file let_instance_missing
    | In module let_instance_missing
    | Cannot find source file for module NoSuchModule imported in module let_instance_missing.
    | *** Errors: 1
    | In module let_instance_missing
    | Cannot find source file for module NoSuchModule imported in module let_instance_missing.
    3002:1 Parsing or semantic analysis failed.
---*)
