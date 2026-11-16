(*---
description: Evaluates a random seq expression, seed 262, number 5241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<IF ([a |-> 1, b |-> TRUE] \/ <<3, 1, 2>>) THEN ([a |-> 1]).a ELSE LET b8118 == 7 IN 2147483647, IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (7 * 7) ELSE IF TRUE THEN 7 ELSE <<>>>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05241 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a record.
    line 14, col 32 to line 14, col 67 of module random_05241
---*)
