(*---
description: Evaluates a random set expression, seed 262, number 4026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<LET b6325 == (3 \div 3) IN Len(<<1>>), [a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (3 < 0)]>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
