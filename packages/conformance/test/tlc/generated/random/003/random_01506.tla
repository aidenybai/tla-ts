(*---
description: Evaluates a random bool expression, seed 262, number 1506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<CASE (TRUE <=> TRUE) -> (CHOOSE b2400 \in {2, 1, 3} : TRUE) [] OTHER -> (0 + 3), IF (2 = 2147483647) THEN (-1 % 7) ELSE (7 * 2)>> = (CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
