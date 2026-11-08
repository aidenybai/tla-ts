(*---
description: Evaluates a random set expression, seed 262, number 6452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq([Append(<<1>>, 2) EXCEPT ![1] = Cardinality({1, 2})], LAMBDA e : e > 0) \cap DOMAIN ((~TRUE) @@ ([x \in 1..2 |-> x] @@ <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06452 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)
