(*---
description: Evaluates a random int expression, seed 262, number 5271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![Head(<<3, 3>>)] = ((-0) % ([x \in 1..2 |-> x])[2147483647])])[Cardinality({(CHOOSE b8158 \in Nat : FALSE), (-2)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 71 of module random_05271
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05271 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 159 to line 14, col 186 of module random_05271
---*)
