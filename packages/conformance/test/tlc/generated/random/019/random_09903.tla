(*---
description: Evaluates a random int expression, seed 262, number 9903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b15398 \in UNION {{1}, {1}} |-> (2147483647 % 3)])[((0 + 2147483647) - (3 + 7))] % LET b15399 == Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) IN ([[a |-> 1] EXCEPT !.a = @ + 2147483647] * (0 + [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09903 failed.
    In applying the function
    <<1>>,
    the first argument is:
    2147483637
    which is not in its domain.
---*)
