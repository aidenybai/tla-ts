(*---
description: Evaluates a random bool expression, seed 262, number 6956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({2, 3} \ DOMAIN <<5, 6>>)) \div IF ((2 = 2147483647) <=> (<<3, 1, 2>> = <<5, 6>>)) THEN Cardinality((3 .. 7)) ELSE ((CHOOSE b10641 \in {} : TRUE) * (7 + 2))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
