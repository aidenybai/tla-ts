(*---
description: Evaluates a random int expression, seed 262, number 8970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail((Len(<<1>>) - ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08970 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    0
---*)
