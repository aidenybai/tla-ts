(*---
description: Evaluates a random set expression, seed 262, number 6258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module random_06258 failed.
      Attempted to construct a set with too many elements (>1000000).
---*)
---- MODULE random_06258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Head(<<3, 1, 2>>), Len(<<1, 2>>)} \cap UNION {(Nat \cap 2..1), (2..1 \ <<1, 2>>)}) \ (((2147483647 - 0) .. LET b9644 == 2 IN 2147483647) \cap {Len(<<1, 2>>) : b9645 \in (3 .. 2147483647)})))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
