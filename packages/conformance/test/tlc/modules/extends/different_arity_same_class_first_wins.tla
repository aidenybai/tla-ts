(*---
description: "Arity is not compared when merging extended contexts, so definitions of different arity only warn and the first wins."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixArity.tla]
outcome: success
---*)
---- MODULE different_arity_same_class_first_wins ----
EXTENDS FixExtA, FixArity
Test == Shared = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 2, col 1 to line 2, col 14 of module FixArity
    | Warning: the definition of 'Shared' conflicts with 
    | its definition at line 2, col 1 to line 2, col 11 of module FixExtA.
---*)
