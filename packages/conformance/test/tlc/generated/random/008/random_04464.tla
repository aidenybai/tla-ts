(*---
description: Evaluates a random seq expression, seed 262, number 4464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(<<[a |-> 3, b |-> TRUE], IF FALSE THEN 2147483647 ELSE 2147483647>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647>>"
---*)
