(*---
description: Evaluates a random set expression, seed 262, number 2293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(1 :> 3) EXCEPT ![(2 - 1)] = Append(<<>>, 3)])[LET b3620 == (0 \div 0) IN (b3620 * b3620)] .. (Cardinality(({} \cup 1..3)) % ((3 * 2) \div Len(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02293 failed.
    2179:0 The second argument of \div is 0.
---*)
