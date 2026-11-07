(*---
description: subseteq_right applied to cross, a SetOfTuplesValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_right_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \subseteq {1, 2} \X {3})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_right_cross failed.
    Attempted to check if non-tuple
    1
    is in the set of tuples:
    {<<1, 3>>, <<2, 3>>}
---*)
