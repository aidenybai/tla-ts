(*---
description: Evaluates a random bool expression, seed 262, number 1072.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01072 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((~FALSE) /\ (\E b1712 \in SUBSET {1} : TRUE))) /\ [a |-> ((CHOOSE b1713 \in Nat : TRUE) - (-1 + 7)), b |-> {(1 - 7), (1 % -1)}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
