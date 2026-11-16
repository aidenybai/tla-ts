(*---
description: Evaluates a random set expression, seed 262, number 9341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((Cardinality(SUBSET {1}) .. ([a |-> 1]).a) \cup [a |-> Cardinality({x \in 1..3 : x > 1}), b |-> (<<1, 2>> = [x \in Nat |-> x + 1])]), (Cardinality({{1, 2} : b14493 \in Nat}) .. ([[a |-> 1] EXCEPT !.a = 3]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09341 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
