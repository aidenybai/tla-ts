(*---
description: Evaluates a random bool expression, seed 262, number 2927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o Len(<<1, 2>>))) \in {((-1 :> 7))[(-b4628)] : b4628 \in DOMAIN [[a |-> 1, b |-> TRUE] EXCEPT ![3] = 0]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2
---*)
