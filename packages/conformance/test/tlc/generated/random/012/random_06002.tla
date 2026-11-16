(*---
description: Evaluates a random seq expression, seed 262, number 6002.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06002 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<IF ([a |-> 1] \in {x \in 1..3 : x > 1}) THEN Len(<<>>) ELSE ([a |-> 1, b |-> TRUE] \div 1), ([a |-> 1, b |-> FALSE]).a>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06002 failed.
    Attempted to compare record:
    [a |-> 1]
    with non-record
    3
---*)
