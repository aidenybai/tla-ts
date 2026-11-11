(*---
description: A parameterized INSTANCE of a missing module is rejected.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE parameterized_instance_missing ----
M(a) == INSTANCE NoSuchModule
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file parameterized_instance_missing
    | In module parameterized_instance_missing
    | Cannot find source file for module NoSuchModule imported in module parameterized_instance_missing.
    | *** Errors: 1
    | In module parameterized_instance_missing
    | Cannot find source file for module NoSuchModule imported in module parameterized_instance_missing.
    3002:1 Parsing or semantic analysis failed.
---*)
