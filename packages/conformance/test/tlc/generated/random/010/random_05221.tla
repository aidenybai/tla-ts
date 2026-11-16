(*---
description: Evaluates a random seq expression, seed 262, number 5221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), (0 + 7), Len(<<3, 1, 2>>)), LAMBDA p, q : p < q), (((1 .. 7) \ {b8096 \in 2..1 : FALSE}))[LET b8097 == ([a |-> 1, b |-> TRUE]).a IN (2147483647 - b8097)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05221 failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 123 to line 14, col 225 of module random_05221
---*)
