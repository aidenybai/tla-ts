(*---
description: Evaluates a random record expression, seed 262, number 1948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((1..3 = {}) % (1)[0]), b |-> ((-2147483647) \in {b3069 \in 1..3 : FALSE})] EXCEPT !.a = (-(-(3 + 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01948 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 39 to line 14, col 44 of module random_01948
---*)
