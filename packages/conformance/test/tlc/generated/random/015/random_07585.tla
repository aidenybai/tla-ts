(*---
description: Evaluates a random bool expression, seed 262, number 7585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SubSeq(<<1>>, 7, 3)) = Len(Tail(<<1>>))) => ((([a |-> 1, b |-> TRUE]).a + (2 \div 2)) < ((3 + {1, 2}) * (1 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07585 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
