(*---
description: The conflict does not depend on order.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
includes: [FixExtA.tla, FixConstant.tla]
outcome: parse-error
---*)
---- MODULE conflict_constant_then_operator ----
EXTENDS FixConstant, FixExtA
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 2, col 1 to line 2, col 11 of module FixExtA
    | The definition of 'Shared' conflicts with 
    | its declaration at line 2, col 10 to line 2, col 15 of module FixConstant.
    3002:1 Parsing or semantic analysis failed.
---*)
