(*---
description: Evaluates a random bool expression, seed 262, number 2378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b3772 \in {} : FALSE} \subseteq ({1} \cup {1, 2})) /\ {(-2147483647), Len(<<1>>)}) \/ (((1 * [a |-> 1, b |-> TRUE]) % (-3)) < (Cardinality({}) * (2147483647 % -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02378 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a set of the form {e1, ... ,eN}.
    line 14, col 18 to line 14, col 100 of module random_02378
---*)
