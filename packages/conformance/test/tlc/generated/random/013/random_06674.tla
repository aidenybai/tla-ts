(*---
description: Evaluates a random int expression, seed 262, number 6674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10231 == (CHOOSE b10232 \in (CHOOSE f \in [2..1 -> {1, 2}] : TRUE) : (Head(<<>>) = (7 % b10232))) IN ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
