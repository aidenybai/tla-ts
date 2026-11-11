(*---
description: Evaluates a random int expression, seed 262, number 8592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {{b13312 \in 2..1 : FALSE}, DOMAIN (1 :> 2)}) \div (IF ([a |-> 1] = [a |-> 1]) THEN (0 - 2) ELSE Cardinality({2, 1, 3}) + (-(CHOOSE b13313 \in 2..1 : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
