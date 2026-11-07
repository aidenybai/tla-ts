(*---
description: Evaluates a random bool expression, seed 262, number 7102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10903 \in ({Head({}), (7 % 7)} \ DOMAIN [b10904 \in {} |-> 0]) : ((DOMAIN [x \in 1..2 |-> x] \cap (1..3 \ Nat)) = {b10905 \in {2 : b10906 \in {2, 1, 3}} : (~TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
