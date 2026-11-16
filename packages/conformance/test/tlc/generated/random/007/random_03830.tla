(*---
description: Evaluates a random record expression, seed 262, number 3830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = (0 % -1)] EXCEPT !.a = (CASE TRUE -> 3 [] OTHER -> 1 + LET b6037 == 7 IN b6037)] EXCEPT !.a = @ + (-(CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03830 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
