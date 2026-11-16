(*---
description: TestRandomSetOfSubsets gives five numbers.
ref: tla2sany/StandardModules/Randomization.tla
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE test_op_length ----
EXTENDS Randomization, FiniteSets, Naturals
Test == DOMAIN TestRandomSetOfSubsets(2, 1, 1..3) = 1..5
====

(*--- recorded
all:
  exit: 0
---*)
