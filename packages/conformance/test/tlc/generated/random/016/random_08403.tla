(*---
description: Evaluates a random function expression, seed 262, number 8403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13004 \in (((SUBSET {1} \cup 2..1) \ (Nat \cap 2..1)) \cap {([a |-> 1, b |-> TRUE]).a, Head(<<3, 1, 2>>)}) |-> LET b13005 == IF (b13004 < [a |-> 1, b |-> TRUE]) THEN LET b13006 == 3 IN b13004 ELSE ([x \in Nat |-> x + 1])[1] IN ((-1 @@ [x \in 1..2 |-> x]))[(b13004 + b13005)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08403 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
