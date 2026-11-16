(*---
description: "The losing definition's arity is gone."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
includes: [FixExtA.tla, FixArity.tla]
outcome: parse-error
---*)
---- MODULE arity_loser_cannot_be_called ----
EXTENDS FixExtA, FixArity
Test == Shared(5) = 5
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 2, col 1 to line 2, col 14 of module FixArity
    | Warning: the definition of 'Shared' conflicts with 
    | its definition at line 2, col 1 to line 2, col 11 of module FixExtA.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 15 to line 10, col 17 of module arity_loser_cannot_be_called
    | The operator Shared requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
