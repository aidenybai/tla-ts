(*---
description: Evaluates a random seq expression, seed 262, number 1178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq((Append(<<>>, 1) \o [<<1, 2>> EXCEPT ![1] = 3]), LAMBDA e : e > 0) \o [[(7 :> 3) EXCEPT ![1] = CASE FALSE -> 0 [] OTHER -> -1] EXCEPT ![1] = Cardinality((0 \in {2, 1, 3}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 100 to line 14, col 105 of module random_01178
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 98 to line 14, col 152 of module random_01178
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    (7 :> 3)
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    (7 :> 3)
---*)
