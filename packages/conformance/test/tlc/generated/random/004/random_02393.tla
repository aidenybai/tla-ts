(*---
description: Evaluates a random bool expression, seed 262, number 2393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Cardinality(Nat) [] OTHER -> Head(<<>>) \in [Tail(<<3, 1, 2>>) EXCEPT ![1] = (-3)]) <=> ((UNION {{2, 1, 3}, {x \in 1..3 : x > 1}} = (Nat \ 2..1)) => (\E b3792 \in (<<5, 6>> .. FALSE) : (b3792 < b3792)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02393 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
