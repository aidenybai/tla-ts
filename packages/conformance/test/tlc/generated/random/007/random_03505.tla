(*---
description: Evaluates a random function expression, seed 262, number 3505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail((<<3, 1, 2>> \o <<>>)) \o SelectSeq(Append(<<>>, 7), LAMBDA e : e > 0)) = (CHOOSE f \in [1..2 -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
