(*---
description: Evaluates a random record expression, seed 262, number 6336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + ([x \in 1..2 |-> x])[0]]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06336 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
