(*---
description: Evaluates a random bool expression, seed 262, number 5595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((FALSE => TRUE) /\ ({1, 2} \subseteq {1})) -> <<(1 % 0), (-2)>> [] OTHER -> ((7 + 2) \div (1 % -1)) = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] :> (7 \div 3)))[(LET b8664 == 7 IN 0 - (-2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
