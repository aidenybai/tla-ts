(*---
description: Evaluates a random seq expression, seed 262, number 8005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(((CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) \o SortSeq(<<7, 0>>, LAMBDA p, q : p < q)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 1)
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 1)
---*)
