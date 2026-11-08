(*---
description: Evaluates a random bool expression, seed 262, number 1321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Tail(FALSE)) < (LET b2108 == 3 IN b2108 + CASE TRUE -> 2147483647 [] OTHER -> 2)) /\ (Cardinality(({2, 1, 3} \cup {1, 2})) = ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = SelectSeq(<<1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01321 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
