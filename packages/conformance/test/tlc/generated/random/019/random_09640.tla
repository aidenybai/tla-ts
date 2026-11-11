(*---
description: Evaluates a random int expression, seed 262, number 9640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((1 :> FALSE) @@ (<<5, 6>> @@ <<5, 6>>)) EXCEPT ![(Cardinality({2, 1, 3}) * (0 % 7))] = (-LET b14967 == 7 IN FALSE)])[((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))[IF (FALSE /\ FALSE) THEN (TRUE).a ELSE Len(<<1>>)]])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 56 of module random_09640
    | 6
---*)
