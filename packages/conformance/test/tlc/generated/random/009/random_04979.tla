(*---
description: Evaluates a random function expression, seed 262, number 4979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(Append(Tail(TRUE), LET b7753 == 3 IN b7753), (([a |-> 1, b |-> TRUE]).a * (3 \div 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
