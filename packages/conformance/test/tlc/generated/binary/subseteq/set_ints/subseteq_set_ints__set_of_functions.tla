(*---
description: subseteq of set_ints, a SetEnumValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_ints__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \subseteq ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_set_ints__set_of_functions failed.
    Attempted to check if 
    1
    which is not a TLC function value, is in the set of functions:
    {<<2>>, <<3>>}
---*)
