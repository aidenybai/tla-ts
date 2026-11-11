(*---
description: Evaluates a random function expression, seed 262, number 9579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b14869 \in {b14870 \in {} : FALSE} : (~TRUE)}) :> ([[b14871 \in 1..3 |-> b14871] EXCEPT ![(0 * 0)] = Head(<<3, 1, 2>>)] @@ [[[x \in Nat |-> x + 1] EXCEPT ![0] = 3] EXCEPT ![(2147483647 + -1)] = Head(<<>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 82 to line 14, col 109 of module random_09579
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09579 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
