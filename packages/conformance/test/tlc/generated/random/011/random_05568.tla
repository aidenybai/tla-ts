(*---
description: Evaluates a random bool expression, seed 262, number 5568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN -1 ELSE 2 * (7 % 3)) = CASE (FALSE <=> FALSE) -> Head(<<>>) [] OTHER -> (1..3 % 2147483647)) <=> [a |-> (-(-Nat)), b |-> ([a |-> 0, b |-> TRUE] = (CHOOSE r \in [a : {1}] : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
