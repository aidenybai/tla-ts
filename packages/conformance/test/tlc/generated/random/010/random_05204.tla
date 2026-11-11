(*---
description: Evaluates a random bool expression, seed 262, number 5204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (TRUE /\ FALSE) -> LET b8074 == 0 IN b8074 [] OTHER -> CASE FALSE -> 0 [] OTHER -> 2147483647 \in ((-1 + 2) .. ([a |-> 1]).a)) \/ CASE ([7 EXCEPT !.a = @ + 2] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]) -> (LET b8075 == [a |-> 1] IN b8075 \div (-1 \div TRUE)) [] OTHER -> (LET b8076 == 2 IN b8076 - Append(<<>>, -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05204 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
