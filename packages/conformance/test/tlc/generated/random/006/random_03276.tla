(*---
description: Evaluates a random bool expression, seed 262, number 3276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((FALSE /\ TRUE) <=> (TRUE <=> FALSE)) -> IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (-1 * 2) ELSE Head([a |-> 1]) [] OTHER -> CASE (TRUE => TRUE) -> Cardinality({2, 1, 3}) [] OTHER -> CASE TRUE -> 0 [] OTHER -> 7 = (CHOOSE b5211 \in {IF TRUE THEN b5212 ELSE b5212 : b5212 \in (2 .. 2)} : (({x \in 1..3 : x > 1} \cup 2..1) = ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03276 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
