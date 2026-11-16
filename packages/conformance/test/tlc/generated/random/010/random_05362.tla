(*---
description: Evaluates a random record expression, seed 262, number 5362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b8293 == (7 + 0) IN (CHOOSE b8294 \in {} : [x \in 1..2 |-> x]), b |-> ((Nat \cup {1, 2}) = (2..1 \ {x \in 1..3 : x > 1}))] EXCEPT !.a = ((CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE))[((3 * 1) - (-3))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05362 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 49 to line 14, col 88 of module random_05362
---*)
