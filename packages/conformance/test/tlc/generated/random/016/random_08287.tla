(*---
description: Evaluates a random record expression, seed 262, number 8287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + ((-(3 \div 7)) \div (LET b12833 == 2 IN b12833 % (-0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08287 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
