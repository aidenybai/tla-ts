(*---
description: Evaluates a random record expression, seed 262, number 597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [b999 \in {b1000 \in {x \in 1..3 : x > 1} : TRUE} |-> IF FALSE THEN b999 ELSE -1], b |-> ([[a |-> 1] EXCEPT !.a = @ + 3] = [a |-> 1, b |-> TRUE])] EXCEPT !.a = @ + (CHOOSE b1001 \in DOMAIN (-1 :> 1) : (\E b1002 \in (2..1 \cap Nat) : ({x \in 1..3 : x > 1} = 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00597 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 189 to line 14, col 286 of module random_00597
---*)
