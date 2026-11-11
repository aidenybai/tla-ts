(*---
description: Evaluates a random record expression, seed 262, number 5707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (UNION {DOMAIN [x \in Nat |-> x + 1], (2..1 \cap {})} \cup {Head(<<1, 2>>), Head(<<3, 1, 2>>)}), b |-> (((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]) \/ [((1 :> 2) @@ [x \in 1..2 |-> x]) EXCEPT ![IF TRUE THEN 0 ELSE 2] = (2 + 7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 212 to line 14, col 241 of module random_05707
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05707 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 127 to line 14, col 285 of module random_05707
---*)
