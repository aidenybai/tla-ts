(*---
description: Evaluates a random seq expression, seed 262, number 6868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), Cardinality(1..3), (1 + -1)), LAMBDA p, q : p < q) EXCEPT ![1] = IF ((\A b10534 \in Nat : {1, 2}) <=> (7 \in {1})) THEN ((-1 :> 1))[(2 % 3)] ELSE (-Head(<<1>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 117 of module random_06868
    | <<>>
---*)
