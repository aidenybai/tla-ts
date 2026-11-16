(*---
description: Evaluates a random seq expression, seed 262, number 4391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append(Tail(<<3, 1, 2>>), Len(<<>>))) \o Append(SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), ([(1 :> 2) EXCEPT ![1] = 2])[(<<>> \o <<>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04391 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<>>
---*)
