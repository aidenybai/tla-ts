(*---
description: Evaluates a random bool expression, seed 262, number 3790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE r \in [a : {1}] : TRUE) < ([a |-> 1, b |-> TRUE]).a) -> (-LET b5977 == 2147483647 IN [a |-> 1]) [] OTHER -> CASE (3 < 7) -> (3 % 0) [] OTHER -> CASE TRUE -> -1 [] OTHER -> TRUE \in ({(<<1>> \div 3) : b5978 \in (\E b5979 \in {2, 1, 3} : FALSE)} \ (UNION {2..1, 2..1} \cup {b5980 \in 2..1 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03790 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1]
---*)
