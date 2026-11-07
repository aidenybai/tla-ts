(*---
description: Evaluates a random seq expression, seed 262, number 9349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([Tail(Append(SUBSET {1}, 1)) EXCEPT ![1] = Cardinality({3, 2147483647})], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
---*)
