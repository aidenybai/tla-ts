(*---
description: Evaluates a random record expression, seed 262, number 3631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (2147483647 + 0), b |-> (0 \in {2, 1, 3})] EXCEPT !.a = ([b5738 \in {2, 1, 3} |-> b5738])[([x \in 1..2 |-> x])[3]]] EXCEPT !.a = (((1 \div 2147483647) + (TRUE \div [a |-> 1, b |-> TRUE])) \div ([[a |-> 1, b |-> TRUE] EXCEPT !.a = <<1, 2>>]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03631 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
