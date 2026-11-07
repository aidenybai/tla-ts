(*---
description: Evaluates a random record expression, seed 262, number 1416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b2255 == (CHOOSE b2256 \in {7 : b2257 \in 2..1} : (<<1>> = <<5, 6>>)) IN Cardinality({b2258 \in 2..1 : TRUE}), b |-> (Head(({1} \cup SUBSET {1})) = (IF FALSE THEN 2147483647 ELSE 2 \div Cardinality({2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1} \cup {{}, {1}}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1} \cup {{}, {1}}
---*)
