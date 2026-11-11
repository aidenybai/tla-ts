(*---
description: Evaluates a random seq expression, seed 262, number 5806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), IF (FALSE => TRUE) THEN Head(<<>>) ELSE ([a |-> 1]).a) \o (SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0) \o Append(Tail(<<>>), Len(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05806 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
