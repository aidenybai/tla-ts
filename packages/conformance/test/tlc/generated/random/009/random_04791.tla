(*---
description: Evaluates a random seq expression, seed 262, number 4791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([a |-> Head(SortSeq(<<>>, LAMBDA p, q : p < q)), b |-> ((7 - 2) \in (TRUE .. 1))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04791 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
