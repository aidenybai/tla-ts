(*---
description: Evaluates a random bool expression, seed 262, number 3724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (0 - 2147483647), (1 * 2))) < LET b5878 == Cardinality(DOMAIN (1 :> 2)) IN Head(<<7, b5878>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03724 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -2147483647
---*)
