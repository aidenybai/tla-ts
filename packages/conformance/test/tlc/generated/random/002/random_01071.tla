(*---
description: Evaluates a random int expression, seed 262, number 1071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((Tail(Append(<<1, 2>>, 1)) \o <<(3 - 3), (3 \div 3)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
