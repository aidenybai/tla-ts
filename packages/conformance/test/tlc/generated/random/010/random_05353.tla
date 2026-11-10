(*---
description: Evaluates a random record expression, seed 262, number 5353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = (-(-2147483647))] EXCEPT !.a = LET b8272 == IF (\E b8273 \in {1, 2} : TRUE) THEN (-0) ELSE LET b8274 == 0 IN b8274 IN IF (FALSE => FALSE) THEN ((1 :> 2))[1] ELSE (CHOOSE b8275 \in {2, 1, 3} : TRUE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
