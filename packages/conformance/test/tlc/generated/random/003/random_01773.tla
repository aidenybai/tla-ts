(*---
description: Evaluates a random set expression, seed 262, number 1773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((([x \in 1..2 |-> x])[-1] \div Head(<<1, 2>>)) :> Cardinality(({1} \cup Nat))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01773 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
