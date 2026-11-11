(*---
description: Evaluates a random record expression, seed 262, number 7568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) EXCEPT !.a = @ + IF TRUE THEN 1 ELSE 0] EXCEPT !.a = @ + (CHOOSE b11650 \in (2 .. (1 :> 2)) : (\A b11651 \in Nat : FALSE))] EXCEPT !.a = @ + ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07568 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
