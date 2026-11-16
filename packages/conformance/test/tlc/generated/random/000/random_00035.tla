(*---
description: Evaluates a random int expression, seed 262, number 35.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (CHOOSE f \in [{1, 2} -> {1}] : TRUE) THEN (3 * <<>>) ELSE LET b53 == 3 IN b53 * ((-7) - Len(<<3, 1, 2>>))) % ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + Cardinality(Nat)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00035 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 18 to line 14, col 126 of module random_00035
---*)
