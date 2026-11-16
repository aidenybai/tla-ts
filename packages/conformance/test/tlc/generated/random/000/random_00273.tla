(*---
description: Evaluates a random function expression, seed 262, number 273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b463 == (CHOOSE b464 \in DOMAIN TRUE : (b464 < b464)) IN IF (TRUE \/ TRUE) THEN LET b465 == 2147483647 IN FALSE ELSE (<<5, 6>>)[b463] :> IF (\A b466 \in (2147483647 \div 3) : (FALSE => FALSE)) THEN (IF (1 :> 2) THEN 2147483647 ELSE 7 + (3 \div 2147483647)) ELSE (([x \in 1..2 |-> x] @@ <<5, 6>>))[(2 - 3)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
