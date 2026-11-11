(*---
description: Each draw has at most k elements.
ref: tla2sany/StandardModules/Randomization.tla
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE test_op_bounds ----
EXTENDS Randomization, FiniteSets, Naturals
Test == \A i \in 1..5 : TestRandomSetOfSubsets(2, 1, 1..3)[i] <= 2
====

(*--- recorded
all:
  exit: 0
---*)
