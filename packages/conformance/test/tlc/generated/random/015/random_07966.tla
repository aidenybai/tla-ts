(*---
description: Evaluates a random bool expression, seed 262, number 7966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b12296 == (1 + TRUE) IN IF TRUE THEN 7 ELSE 2147483647) = Head(<<(2 - -1), (CHOOSE b12297 \in {1} : TRUE)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
