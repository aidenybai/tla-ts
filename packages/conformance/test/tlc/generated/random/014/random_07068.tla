(*---
description: Evaluates a random seq expression, seed 262, number 7068.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07068 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SortSeq(Tail(<<1>>), LAMBDA p, q : p < q), LAMBDA e : e > 0) EXCEPT ![1] = (Head(Append(<<1>>, -1)) * ((3 :> 1) \div ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 86 of module random_07068
    | <<>>
---*)
