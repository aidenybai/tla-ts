(*---
description: Evaluates a random seq expression, seed 262, number 7441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((Tail([a |-> 1]) \o SelectSeq(<<>>, LAMBDA e : e > 0)) \o (Tail(-1) \o [<<3, 1, 2>> EXCEPT ![1] = -1])), ((-(1 + -1)) + Len(Tail(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07441 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 1]
---*)
