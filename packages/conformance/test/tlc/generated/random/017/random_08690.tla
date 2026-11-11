(*---
description: Evaluates a random int expression, seed 262, number 8690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 2147483647]).a - (Cardinality(TRUE) - (0 % 2))) \div (((0 :> 2147483647))[Head(<<1, 2>>)] \div (-(0 - 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08690 failed.
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
