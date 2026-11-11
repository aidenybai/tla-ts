(*---
description: Evaluates a random function expression, seed 262, number 4732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> 2..1] : TRUE) EXCEPT ![(\E b7397 \in ({2147483647, -1} \cap UNION {Nat, {}}) : (~(7 \in 1..3)))] = Cardinality([a |-> (1 - 1), b |-> (1 < 1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04732 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_04732
---*)
