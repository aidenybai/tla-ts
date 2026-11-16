(*---
description: Evaluates a random seq expression, seed 262, number 7767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<IF (FALSE \/ TRUE) THEN Head(<<3, 1, 2>>) ELSE ([a |-> 1]).a, ((-1 + 2) % LET b11983 == 7 IN b11983)>> \o (Append(SubSeq(<<1>>, 2147483647, 2147483647), Cardinality(1..3)) \o Append(SortSeq(<<1>>, LAMBDA p, q : p < q), Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07767 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2147483647
---*)
