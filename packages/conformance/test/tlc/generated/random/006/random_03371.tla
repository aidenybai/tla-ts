(*---
description: Evaluates a random seq expression, seed 262, number 3371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append([Tail(<<1>>) EXCEPT ![1] = (2147483647 + 1)], ((1 * 0) + ([a |-> 1, b |-> TRUE]).a)) EXCEPT ![1] = CASE ((2147483647 .. 2) \subseteq {2147483647, 2147483647}) -> Head(Append(<<3, 1, 2>>, -1)) [] OTHER -> Cardinality({b5350 : b5350 \in {x \in 1..3 : x > 1}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 35 of module random_03371
    | <<3>>
---*)
