(*---
description: Evaluates a random seq expression, seed 262, number 3965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<Cardinality(({} \ {1})), (([a |-> 1]).a - (2147483647 % 0))>> EXCEPT ![1] = Head(Tail(<<<<3, 1, 2>>, 3>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03965 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
