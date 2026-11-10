(*---
description: Evaluates a random set expression, seed 262, number 5796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 - 7) + (7 \div 3)) .. LET b8938 == LET b8939 == 1 IN 3 IN (7 * b8938)) \cap DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
