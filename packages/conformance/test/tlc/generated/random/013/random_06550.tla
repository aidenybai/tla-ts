(*---
description: Evaluates a random bool expression, seed 262, number 6550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Len(SelectSeq(<<>>, LAMBDA e : e > 0)) \in [b10068 \in (7 .. 2147483647) |-> ([x \in Nat |-> x + 1])[-1]])))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
