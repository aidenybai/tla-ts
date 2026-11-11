(*---
description: An operator and a variable of one name in two extended modules is an error.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
includes: [FixExtA.tla, FixVariable.tla]
outcome: parse-error
---*)
---- MODULE conflict_operator_then_variable ----
EXTENDS FixExtA, FixVariable
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 2, col 10 to line 2, col 15 of module FixVariable
    | The declaration of 'Shared' conflicts with 
    | its definition at line 2, col 1 to line 2, col 11 of module FixExtA.
    3002:1 Parsing or semantic analysis failed.
---*)
