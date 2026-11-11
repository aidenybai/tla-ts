(*---
description: "With the arity-1 definition first, the name takes one argument."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixArity.tla]
outcome: success
---*)
---- MODULE different_arity_other_order ----
EXTENDS FixArity, FixExtA
Test == Shared(5) = 5
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 2, col 1 to line 2, col 11 of module FixExtA
    | Warning: the definition of 'Shared' conflicts with 
    | its definition at line 2, col 1 to line 2, col 14 of module FixArity.
---*)
