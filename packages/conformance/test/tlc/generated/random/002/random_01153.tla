(*---
description: Evaluates a random record expression, seed 262, number 1153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (Cardinality(UNION {SUBSET {1}, {}}) % CASE (FALSE \/ TRUE) -> (3 % 1) [] OTHER -> LET b1850 == 1 IN 2147483647)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01153 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
