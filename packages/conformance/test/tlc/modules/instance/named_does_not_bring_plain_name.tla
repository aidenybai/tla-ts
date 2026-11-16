(*---
description: A named instance does not bring plain names.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
outcome: parse-error
---*)
---- MODULE named_does_not_bring_plain_name ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
Test == A = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 9 to line 12, col 9 of module named_does_not_bring_plain_name
    | Unknown operator: `A'.
    3002:1 Parsing or semantic analysis failed.
---*)
