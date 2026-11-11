(*---
description: Evaluates a random int expression, seed 262, number 8495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\E b13151 \in ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}) : <<b13151, b13151>>) THEN IF (FALSE /\ TRUE) THEN Cardinality({1, 2}) ELSE Len(<<1>>) ELSE (LET b13152 == 3 IN 2147483647 % Len(<<3, 1, 2>>)) * CASE (Tail(<<3, 1, 2>>) = ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])) -> Cardinality(({1, 2} \cup 1..3)) [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08495 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 21 to line 14, col 103 of module random_08495
---*)
