(*---
description: Evaluates a random seq expression, seed 262, number 9918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = ((((1 :> 2) @@ [x \in Nat |-> x + 1]))[(<<1>>).a] - CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> LET b15428 == 2147483647 IN 7 [] OTHER -> (3 * 3))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 108 of module random_09918
    | <<>>
---*)
