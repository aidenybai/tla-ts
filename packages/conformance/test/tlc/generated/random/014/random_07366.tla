(*---
description: Evaluates a random seq expression, seed 262, number 7366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Len((<<1>> \o <<3, 1, 2>>)), Cardinality(({1, 2} \cap {}))>>, Head({b11332 \in {7, -1} : ({} \subseteq {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07366 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {-1, 7}
---*)
