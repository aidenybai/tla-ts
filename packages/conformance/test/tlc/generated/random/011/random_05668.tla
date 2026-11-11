(*---
description: Evaluates a random record expression, seed 262, number 5668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (1 + 2147483647), b |-> (2 < -1)] EXCEPT !.a = Head(<<1, 7>>)] EXCEPT !.a = Head(Append(SubSeq(<<3, 1, 2>>, 2, 0), (-1 + 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05668 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
