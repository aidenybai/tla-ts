(*---
description: Asks whether int_minimum is in set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_of_functions__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \in ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_of_functions__int_minimum failed.
    Attempted to check if 
    -2147483648
    which is not a TLC function value, is in the set of functions:
    {<<2>>, <<3>>}
---*)
