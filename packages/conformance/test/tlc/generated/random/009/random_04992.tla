(*---
description: Evaluates a random seq expression, seed 262, number 4992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (-1 - -1)] EXCEPT !.a = @ + Head(SortSeq(<<>>, LAMBDA p, q : p < q))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04992 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
