(*---
description: Evaluates a random int expression, seed 262, number 8368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12942 == (({2, 1, 3} = 1..3) - Cardinality(SUBSET {1})) IN LET b12943 == Len(<<1, 2>>) IN CASE TRUE -> b12943 [] OTHER -> 7 - IF (~(\A b12944 \in 2..1 : TRUE)) THEN (Len(<<1, 2>>) - (2147483647 - 7)) ELSE ((CHOOSE b12945 \in SUBSET {1} : TRUE) - (<<5, 6>>)[0])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
