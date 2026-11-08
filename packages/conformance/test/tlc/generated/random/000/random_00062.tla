(*---
description: Evaluates a random bool expression, seed 262, number 62.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b88 == [[[x \in 1..2 |-> x] EXCEPT ![1] = 7] EXCEPT ![(0 + 3)] = ([a |-> 1, b |-> TRUE]).a] IN Len(Tail(FALSE)), (LET b89 == ((1 :> 2))[2147483647] IN Head(<<3, 1, 2>>) % Cardinality(([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00062 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
