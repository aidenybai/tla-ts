(*---
description: Evaluates a random record expression, seed 262, number 6759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-(2 % 2147483647)) - Cardinality(DOMAIN [x \in Nat |-> x + 1])) EXCEPT !.a = LET b10360 == ((0 + 0) * Head(<<>>)) IN ([b10361 \in {2, 1, 3} |-> 2])[LET b10362 == b10360 IN b10362]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
