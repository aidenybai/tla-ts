(*---
description: "A SPECIFICATION with no box has no next-state relation, so TLC refuses it as a config error before it looks at any state, even a violating one."
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: config-error
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE no_next_violating_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Spec == x = 1
====

(*--- recorded
all:
  exit: 151
  transcript: 2232:1 The configuration file did not specify the next state predicate.
---*)
