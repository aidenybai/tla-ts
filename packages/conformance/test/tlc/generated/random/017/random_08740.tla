(*---
description: Evaluates a random function expression, seed 262, number 8740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF [[x \in 1..2 |-> x] EXCEPT ![7] = 2147483647] THEN IF FALSE THEN 7 ELSE 2 ELSE {[x \in Nat |-> x + 1] : b13534 \in 1..3} - IF (\A b13535 \in {} : FALSE) THEN ([a |-> 1, b |-> TRUE]).a ELSE (2147483647 % 0)) :> ([[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + Head(7)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 39 of module random_08740
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08740 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 18 to line 14, col 225 of module random_08740
---*)
