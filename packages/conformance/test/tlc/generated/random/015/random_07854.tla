(*---
description: Evaluates a random set expression, seed 262, number 7854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Cardinality({}) + (2)[2]) % (((1 :> 2) % 3) * (FALSE).a)), Cardinality({Head(<<1>>), (7 % -1)})>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07854 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 38 to line 14, col 43 of module random_07854
---*)
