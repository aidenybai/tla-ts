(*---
description: Evaluates a random int expression, seed 262, number 3226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(UNION {{(7 \in Nat) : b5128 \in (1 .. 2147483647)}, ((-3) .. Len(<<3, 1, 2>>))}))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
