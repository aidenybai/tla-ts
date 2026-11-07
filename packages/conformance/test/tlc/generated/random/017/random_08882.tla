(*---
description: Evaluates a random seq expression, seed 262, number 8882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(LET b13759 == -1 IN 2147483647 % (3 + 0)), Cardinality({b13760 \in {1} : TRUE})>>, ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 1>>"
---*)
