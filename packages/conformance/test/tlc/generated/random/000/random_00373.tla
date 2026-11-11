(*---
description: Evaluates a random record expression, seed 262, number 373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((LET b613 == 1 IN b613 \div Len(<<1>>)) + (((1 :> 2))[3] \div (7 % 1))), b |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = [[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = (CHOOSE b614 \in {1} : FALSE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00373 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
