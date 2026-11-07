(*---
description: Evaluates a random bool expression, seed 262, number 4573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) \o SortSeq([<<>> EXCEPT ![1] = -1], LAMBDA p, q : p < q)) = ((((1 :> 2))[7] * (-3)) :> Len(SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 83 to line 14, col 86 of module random_04573
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 0)
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 0)
---*)
