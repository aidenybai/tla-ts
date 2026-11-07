(*---
description: Evaluates a random bool expression, seed 262, number 8464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ([a |-> 2, b |-> TRUE]).a, b |-> ((\E b13094 \in SUBSET {1} : TRUE) \/ (FALSE => FALSE))] = [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + LET b13095 == (CHOOSE b13096 \in {2, 1, 3} : TRUE) IN (CHOOSE b13097 \in {x \in 1..3 : x > 1} : TRUE)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
