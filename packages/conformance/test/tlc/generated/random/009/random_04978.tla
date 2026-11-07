(*---
description: Evaluates a random seq expression, seed 262, number 4978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq(<<IF [a |-> 1, b |-> TRUE] THEN 7 ELSE -1, (-1 % 2147483647)>>, LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04978 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 38 to line 14, col 76 of module random_04978
---*)
