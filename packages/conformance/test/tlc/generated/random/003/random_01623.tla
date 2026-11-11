(*---
description: Evaluates a random function expression, seed 262, number 1623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b2588 \in DOMAIN <<5, 6>> |-> (b2588 + b2588)] EXCEPT ![(CHOOSE b2589 \in ({2, 1, 3} \cap 2..1) : (\E b2590 \in 2..1 : FALSE))] = (IF TRUE THEN 1 ELSE 0 % [<<1, 2>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]])] @@ (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01623 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 76 to line 14, col 143 of module random_01623
---*)
