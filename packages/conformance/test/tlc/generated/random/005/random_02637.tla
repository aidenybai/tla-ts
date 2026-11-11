(*---
description: Evaluates a random int expression, seed 262, number 2637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Head([<<3, 1, 2>> EXCEPT ![1] = 0])) * (CHOOSE b4161 \in {LET b4162 == 7 IN b4162, LET b4163 == 2 IN -1} : ((FALSE \/ FALSE) \/ (\E b4164 \in SUBSET {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
