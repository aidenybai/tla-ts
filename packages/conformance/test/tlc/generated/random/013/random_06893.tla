(*---
description: Evaluates a random int expression, seed 262, number 6893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b10556 == IF (-1 = 2) THEN Head(<<3, 1, 2>>) ELSE (7 + 7) IN Cardinality({b10556, 7}) - ([[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = @ + (2147483647 - 0)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2147483647
    2178:0 Overflow when computing 2147483647+2147483647
---*)
