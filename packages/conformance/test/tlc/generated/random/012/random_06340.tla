(*---
description: Evaluates a random bool expression, seed 262, number 6340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF (~FALSE) THEN (-3) ELSE (CHOOSE b9741 \in {1, 2} : FALSE)) \in {b9742 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) : (\A b9743 \in UNION {{1, 2}, {1}} : (b9743 = 7))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
