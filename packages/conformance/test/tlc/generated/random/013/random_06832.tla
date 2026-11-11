(*---
description: Evaluates a random function expression, seed 262, number 6832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b10468 \in {Len(<<3, 1, 2>>), IF TRUE THEN 3 ELSE 0} : (Tail(<<1, 2>>) = [b10469 \in 1..3 |-> 2147483647])} @@ [(CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![([a |-> 3, b |-> TRUE]).a] = Cardinality(DOMAIN <<5, 6>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 131 to line 14, col 175 of module random_06832
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06832 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {}
---*)
