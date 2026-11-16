(*---
description: Evaluates a random seq expression, seed 262, number 3886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SortSeq(SubSeq(<<3, 1, 2>>, 2147483647, -1), LAMBDA p, q : p < q), LAMBDA p, q : p < q), ((IF FALSE THEN 2 ELSE 3 - ([x \in 1..2 |-> x])[3]) - (Len(<<1, 2>>) \div ([x \in 1..2 |-> x] % 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03886 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
