(*---
description: Evaluates a random function expression, seed 262, number 4164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE) EXCEPT ![IF (~(FALSE \/ FALSE)) THEN CASE (FALSE /\ TRUE) -> Len(<<>>) [] OTHER -> Cardinality(1..3) ELSE IF (FALSE <=> 2) THEN (2147483647 - -1) ELSE (7 - -1)] = (-((-1 :> 2147483647))[(1 + -1)])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 67 of module random_04164
    | (2 :> 1)
---*)
