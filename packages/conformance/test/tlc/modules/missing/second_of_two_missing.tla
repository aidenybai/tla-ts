(*---
description: A later name in EXTENDS is still looked up.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE second_of_two_missing ----
EXTENDS Naturals, NoSuchModule
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file second_of_two_missing
    | In module second_of_two_missing
    | Cannot find source file for module NoSuchModule imported in module second_of_two_missing.
    | *** Errors: 1
    | In module second_of_two_missing
    | Cannot find source file for module NoSuchModule imported in module second_of_two_missing.
    3002:1 Parsing or semantic analysis failed.
---*)
