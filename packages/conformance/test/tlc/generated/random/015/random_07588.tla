(*---
description: Evaluates a random set expression, seed 262, number 7588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(CHOOSE f \in [{1, 2} -> 1..2] : TRUE) EXCEPT ![Len([<<3, 1, 2>> EXCEPT ![1] = 3])] = ((1 + -1) * LET b11677 == 1 IN 0)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 60 of module random_07588
    | {1, 2}
---*)
