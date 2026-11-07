(*---
description: Evaluates a random bool expression, seed 262, number 6377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 % 0) - LET b9803 == 7 IN b9803) * (([x \in Nat |-> x + 1])[3] + (-2147483647))) = (CASE (TRUE <=> FALSE) -> CASE TRUE -> 2 [] OTHER -> -1 [] OTHER -> LET b9804 == -1 IN {x \in 1..3 : x > 1} + (Len(<<3, 1, 2>>) % ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
