(*---
description: Evaluates a random seq expression, seed 262, number 9826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality({})], (IF FALSE THEN 1 ELSE 3 - IF FALSE THEN 7 ELSE 3), (Len(<<1>>) \div LET b15256 == 2 IN b15256)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 67 of module random_09826
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
