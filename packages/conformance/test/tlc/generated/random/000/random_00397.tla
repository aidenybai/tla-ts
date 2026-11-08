(*---
description: Evaluates a random seq expression, seed 262, number 397.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00397 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SubSeq((SUBSET {1} \cap {}), (0 % 0), IF FALSE THEN 1 ELSE 2147483647) \o SelectSeq(Append(<<1>>, <<1, 2>>), LAMBDA e : e > 0)) EXCEPT ![1] = (SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) \o [SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = LET b656 == -1 IN -1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00397 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
