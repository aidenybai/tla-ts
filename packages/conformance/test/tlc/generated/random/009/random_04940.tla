(*---
description: Evaluates a random function expression, seed 262, number 4940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b7687 \in {(-1 * b7688) : b7688 \in UNION {{2, 1, 3}, {1}}} |-> SelectSeq(SubSeq(3, b7687, b7687), LAMBDA e : e > 0)] @@ ((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE) @@ [([x \in 1..2 |-> x] @@ (1 :> 2)) EXCEPT ![CASE [x \in 1..2 |-> x] -> 1 [] OTHER -> 0] = Head(<<3, 1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04940 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    3
---*)
