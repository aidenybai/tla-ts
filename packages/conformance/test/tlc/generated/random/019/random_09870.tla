(*---
description: Evaluates a random bool expression, seed 262, number 9870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({1 : b15333 \in {x \in 1..3 : x > 1}} \ UNION {{2, 1, 3}, {}}) \subseteq {(0 % 7), (-2)}) \/ (UNION {{b15334 \in {2, 1, 3} : FALSE}, UNION {{2, 1, 3}, {1, 2}}} = (UNION {{1}, 2..1} \cup {-1, 2147483647}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
