(*---
description: Evaluates a random bool expression, seed 262, number 2625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4135 \in {Head(FALSE), ([a |-> 1]).a} : ((2147483647 % 2) = (CHOOSE b4136 \in 2..1 : TRUE))) \in (((2..1 \ {2, 1, 3}) \cap (3 \div 1)) \ {Cardinality(<<1>>), (1 + 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
