(*---
description: Evaluates a random function expression, seed 262, number 7786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (Cardinality({x \in 1..3 : x > 1}) % Head(<<3, 1, 2>>)), b |-> ((2 < 3) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1]))] @@ (CHOOSE f \in [{1} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07786 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 141 to line 14, col 173 of module random_07786
---*)
