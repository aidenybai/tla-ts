(*---
description: Evaluates a random bool expression, seed 262, number 8745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((~FALSE) \/ (FALSE \/ FALSE)) \/ ((CHOOSE b13536 \in Nat : FALSE) \in (3 .. 1))) <=> ((~([a |-> 1] <=> FALSE)) <=> (({2, 1, 3} \subseteq 1..3) /\ (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08745 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 108 to line 14, col 126 of module random_08745
---*)
