(*---
description: Evaluates a random bool expression, seed 262, number 2168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(<<IF TRUE THEN 2 ELSE 3, Cardinality(1..3)>>, CASE (<<1, 2>> = (1 :> 2)) -> ([x \in 1..2 |-> x])[3] [] OTHER -> Head(<<1>>)), (((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE) @@ (~TRUE)) + ([FALSE EXCEPT !.a = 2147483647]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02168 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 159 to line 14, col 201 of module random_02168
---*)
