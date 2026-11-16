(*---
description: Evaluates a random set expression, seed 262, number 6509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1).a .. Len(<<1, 2>>)) .. (-([a |-> 1]).a)) \cup (Head(SortSeq(<<>>, LAMBDA p, q : p < q)) .. ((-1 - 1) * ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06509 failed.
    Attempted to select field "a" from a non-record value 1
    line 14, col 19 to line 14, col 23 of module random_06509
---*)
