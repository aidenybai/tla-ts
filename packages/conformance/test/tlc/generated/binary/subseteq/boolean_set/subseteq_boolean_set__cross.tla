(*---
description: subseteq of boolean_set, a SetEnumValue, and cross, a SetOfTuplesValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_boolean_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \subseteq ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_boolean_set__cross failed.
    Attempted to check if non-tuple
    FALSE
    is in the set of tuples:
    {<<1, 3>>, <<2, 3>>}
---*)
