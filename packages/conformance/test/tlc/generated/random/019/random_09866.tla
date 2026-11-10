(*---
description: Evaluates a random int expression, seed 262, number 9866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(((<<1>> \o <<3, 1, 2>>) \o <<3, 2147483647>>), ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 7"
---*)
