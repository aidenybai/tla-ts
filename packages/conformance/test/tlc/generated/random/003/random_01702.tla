(*---
description: Evaluates a random record expression, seed 262, number 1702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE b2712 \in 2..1 : TRUE) - CASE TRUE -> 0 [] OTHER -> 3) - (([x \in 1..2 |-> x])[7] % Head(<<1, 2>>))), b |-> (Cardinality({b2713 : b2713 \in {1, 2}}) :> (CHOOSE b2714 \in {b2715 \in Nat : TRUE} : ([a |-> 1] = 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01702 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 53 of module random_01702
---*)
