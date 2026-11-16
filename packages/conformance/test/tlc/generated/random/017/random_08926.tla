(*---
description: Evaluates a random int expression, seed 262, number 8926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13841 \in {IF FALSE THEN b13842 ELSE 1 : b13842 \in {1, 3}} |-> CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> (3 * b13841) [] OTHER -> (7 * b13841)])[Cardinality(CASE (<<>> = [x \in Nat |-> x + 1]) -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> Append(<<1, 2>>, 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08926 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
