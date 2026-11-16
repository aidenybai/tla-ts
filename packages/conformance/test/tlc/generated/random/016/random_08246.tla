(*---
description: Evaluates a random int expression, seed 262, number 8246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (~([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] \/ (FALSE /\ FALSE))) THEN Cardinality({(3 * b12761) : b12761 \in [-1 EXCEPT !.a = 2]}) ELSE (([[a |-> 1] EXCEPT !.a = 7] = [[a |-> 1] EXCEPT !.a = 0]) + (Cardinality({2, 1, 3}) \div Len(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08246 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a record.
    line 14, col 22 to line 14, col 79 of module random_08246
---*)
