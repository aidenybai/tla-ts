(*---
description: Evaluates a random seq expression, seed 262, number 9383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head((SortSeq(<<1>>, LAMBDA p, q : p < q) \o <<7, 1>>)), ((CHOOSE f \in [1..2 -> 1..2] : TRUE))[((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a]>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
