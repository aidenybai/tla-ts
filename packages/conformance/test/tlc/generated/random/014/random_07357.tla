(*---
description: Evaluates a random seq expression, seed 262, number 7357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq((SubSeq(<<>>, 2147483647, -1) \o [[a |-> 1] EXCEPT !.a = -1]), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07357 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> -1]
---*)
