(*---
description: Evaluates a random set expression, seed 262, number 3793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) EXCEPT ![(IF TRUE THEN 2147483647 ELSE 2 + ([a |-> 1, b |-> TRUE]).a)] = (IF TRUE THEN 3 ELSE 2147483647 % Head(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 65 of module random_03793
    | {1, 2, 3}
---*)
