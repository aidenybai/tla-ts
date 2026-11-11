(*---
description: Evaluates a random int expression, seed 262, number 8081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(0 + 2147483647)) \div Len(SelectSeq(<<1>>, LAMBDA e : e > 0))) \div SortSeq([<<-1, 2>> EXCEPT ![1] = IF [a |-> 1] THEN 7 ELSE 2], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08081 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 122 to line 14, col 147 of module random_08081
---*)
