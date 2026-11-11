(*---
description: Evaluates a random bool expression, seed 262, number 8160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12624 \in {(Head(<<3, 1, 2>>) % ([a |-> 1]).a), (-Cardinality(1..3))} |-> DOMAIN ({b12625 \in {} : TRUE} \cap (7 .. -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08160 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form {e1, ... ,eN})
    line 14, col 92 to line 14, col 137 of module random_08160
---*)
