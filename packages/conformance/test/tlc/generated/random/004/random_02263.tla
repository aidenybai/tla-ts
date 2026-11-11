(*---
description: Evaluates a random seq expression, seed 262, number 2263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append((Tail(TRUE) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), (-(1 % 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02263 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
