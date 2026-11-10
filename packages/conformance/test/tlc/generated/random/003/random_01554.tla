(*---
description: Evaluates a random function expression, seed 262, number 1554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [2..1 -> 1..2] : TRUE) @@ ([(2147483647 :> 1) EXCEPT ![Len(<<1>>)] = (3 \div 2)] @@ [[b2479 \in 2..1 |-> b2479] EXCEPT ![Cardinality(1..3)] = ([a |-> 1, b |-> TRUE]).a])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 60 to line 14, col 74 of module random_01554
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 116 to line 14, col 141 of module random_01554
    | (2147483647 :> 1)
---*)
