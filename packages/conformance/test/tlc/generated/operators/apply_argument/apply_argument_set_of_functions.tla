(*---
description: apply_argument applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_argument_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1, 2} |-> e][[{1} -> {2, 3}]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_argument_set_of_functions failed.
    Attempted to check equality of integer 1 with non-integer:
    {<<2>>, <<3>>}
---*)
