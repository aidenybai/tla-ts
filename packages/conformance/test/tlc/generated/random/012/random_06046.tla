(*---
description: Evaluates a random bool expression, seed 262, number 6046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((\A b9313 \in {1} : TRUE) /\ (~FALSE)) -> LET b9314 == SubSeq(<<1>>, -1, 1) IN Cardinality({1, 2}) [] OTHER -> ([[x \in 1..2 |-> x] EXCEPT ![-1] = 1])[Cardinality({x \in 1..3 : x > 1})] < CASE ((2 :> 2) = [a |-> 0, b |-> TRUE]) -> (Cardinality({x \in 1..3 : x > 1}) % (2147483647 - 0)) [] OTHER -> Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
