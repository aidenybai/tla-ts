(*---
description: Evaluates a random seq expression, seed 262, number 7077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<([[a |-> 1] EXCEPT !.a = @ + 0]).a, IF SortSeq(<<1>>, LAMBDA p, q : p < q) THEN (FALSE - 0) ELSE Head(<<3, 1, 2>>)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07077 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 59 to line 14, col 136 of module random_07077
---*)
