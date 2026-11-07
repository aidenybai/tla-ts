(*---
description: Evaluates a random bool expression, seed 262, number 3512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> 1..2] : TRUE) => (\E b5551 \in ({b5552 : b5552 \in {x \in 1..3 : x > 1}} \ (7 .. [x \in 1..2 |-> x])) : (\E b5553 \in {2147483647 : b5554 \in {1, 2}} : (1..3 = {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03512 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 17 to line 14, col 202 of module random_03512
---*)
