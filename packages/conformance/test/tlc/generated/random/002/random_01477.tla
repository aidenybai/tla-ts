(*---
description: Evaluates a random function expression, seed 262, number 1477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<Len(<<3, 1, 2>>), ([a |-> 1, b |-> TRUE]).a>>) % Len(([<<1, 2>> EXCEPT ![1] = 2147483647] \o <<1, 1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
