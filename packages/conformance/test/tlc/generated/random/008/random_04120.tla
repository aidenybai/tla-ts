(*---
description: Evaluates a random seq expression, seed 262, number 4120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), (([a |-> 1]).a % (CHOOSE b6472 \in {} : TRUE)), IF (3 = -1) THEN (-0) ELSE Len(<<3, 1, 2>>)) EXCEPT ![1] = (((3 - 2147483647) :> CASE {1} -> 1 [] OTHER -> 7))[(CHOOSE b6473 \in {b6474 : b6474 \in Nat} : (TRUE /\ [x \in Nat |-> x + 1]))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04120 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 113 to line 14, col 138 of module random_04120
---*)
