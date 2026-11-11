(*---
description: Evaluates a random record expression, seed 262, number 7401.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07401 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = LET b11398 == (CHOOSE b11399 \in (1..3 \cap {x \in 1..3 : x > 1}) : (FALSE \/ TRUE)) IN ([[a |-> 1] EXCEPT !.a = @ + 7]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 8]"
---*)
