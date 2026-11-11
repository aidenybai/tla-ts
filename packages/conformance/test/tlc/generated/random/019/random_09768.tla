(*---
description: Evaluates a random seq expression, seed 262, number 9768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(Tail(Append(<<3, 1, 2>>, 7)), CASE (3 = -1) -> (0 - -1) [] OTHER -> ([x \in Nat |-> x + 1])[0]), Len([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (0 + 2)])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 132 to line 14, col 165 of module random_09768
    | <<1, 2, 7, 1, 0>>
---*)
