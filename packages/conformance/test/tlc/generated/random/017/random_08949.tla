(*---
description: Evaluates a random seq expression, seed 262, number 8949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), CASE FALSE -> 2 [] OTHER -> <<1>>, Len(<<1>>)) EXCEPT ![1] = Head(Append(<<>>, 2147483647))] \o SortSeq([SubSeq(<<1>>, -1, [a |-> 1]) EXCEPT ![1] = Len(<<1, 2>>)], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08949 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
