(*---
description: Evaluates a random set expression, seed 262, number 130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b201 \in (((Nat \ {}) \cap {2, 3}) \ ((-0) .. (-0))) : (((2 % -1) < (CHOOSE b202 \in Nat : FALSE)) /\ ({b201 : b203 \in {x \in 1..3 : x > 1}} \subseteq {b204 \in b201 : TRUE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
