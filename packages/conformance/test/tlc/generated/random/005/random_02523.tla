(*---
description: Evaluates a random bool expression, seed 262, number 2523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(SelectSeq(<<1>>, LAMBDA e : e > 0)), SortSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)} = {b3979 \in ({b3980 : b3980 \in SUBSET {1}} \ (3 .. 1)) : (DOMAIN <<5, 6>> \subseteq DOMAIN 2147483647)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02523 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 218 to line 14, col 234 of module random_02523
---*)
