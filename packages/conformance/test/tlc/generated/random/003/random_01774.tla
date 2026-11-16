(*---
description: Evaluates a random function expression, seed 262, number 1774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<Len(<<1>>), Head(<<>>)>>) :> LET b2810 == ([(1 :> 2) EXCEPT ![2147483647] = -1])[(2 * 1)] IN (([a |-> 1, b |-> TRUE]).a * ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01774 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
