(*---
description: Evaluates a random function expression, seed 262, number 3767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b5940 == Tail(<<1, 2>>) IN CASE TRUE -> b5940 [] OTHER -> 3 * (CHOOSE b5941 \in {2, 1} : LET b5942 == SUBSET {1} IN b5941)) :> [((CHOOSE b5943 \in {2, 1, 3} : FALSE) :> Head(<<>>)) EXCEPT ![(Cardinality({x \in 1..3 : x > 1}) - (7 * 0))] = (\A b5944 \in {2147483647, 2} : ((1 :> 2) = [a |-> 1]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03767 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 152 to line 14, col 185 of module random_03767
---*)
