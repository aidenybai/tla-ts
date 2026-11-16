(*---
description: Evaluates a random function expression, seed 262, number 8272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((0 = 0) /\ (~TRUE)) -> IF (\E b12810 \in 1..3 : TRUE) THEN (CHOOSE b12811 \in Nat : TRUE) ELSE (-1 + 2147483647) [] OTHER -> (Cardinality({1, 2}) \div IF TRUE THEN 2 ELSE 7) :> ((Head(<<1>>) :> (CHOOSE b12812 \in {2, 1, 3} : TRUE)))[(LET b12813 == 0 IN b12813 + Head(<<>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08272 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
