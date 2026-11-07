(*---
description: Evaluates a random seq expression, seed 262, number 3308.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03308 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(Append((TRUE \o <<>>), ([a |-> 1, b |-> TRUE]).a), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
---*)
