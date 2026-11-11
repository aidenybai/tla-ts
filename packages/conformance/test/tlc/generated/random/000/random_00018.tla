(*---
description: Evaluates a random function expression, seed 262, number 18.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b21 \in (CHOOSE b22 \in ((2..1 \cup 2..1) \ ({1, 2} \cup 2..1)) : ((0 \in Nat) /\ (TRUE \/ FALSE))) |-> LET b23 == CASE (<<>> = (1 :> 2)) -> Head(<<3, 1, 2>>) [] OTHER -> (CHOOSE b24 \in {2, 1, 3} : TRUE) IN CASE (<<>> = [x \in 1..2 |-> x]) -> (b21 - 0) [] OTHER -> (-0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00018 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 114 of module random_00018
---*)
