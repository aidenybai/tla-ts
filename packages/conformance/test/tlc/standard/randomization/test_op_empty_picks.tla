(*---
description: TestRandomSetOfSubsets is a TLA+ definition with five draws.
ref: tla2sany/StandardModules/Randomization.tla
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE test_op_empty_picks ----
EXTENDS Randomization, FiniteSets, Naturals
Test == TestRandomSetOfSubsets(0, 1, {1}) = <<0, 0, 0, 0, 0>>
====

(*--- recorded
all:
  exit: 0
---*)
