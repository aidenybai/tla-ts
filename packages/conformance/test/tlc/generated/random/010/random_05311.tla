(*---
description: Evaluates a random record expression, seed 262, number 5311.
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
---- MODULE random_05311 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b8215 == ((1 \div 7) \div Len(<<1>>)) IN LET b8216 == (-1 \div [a |-> 1]) IN Head(<<1, 2>>), b |-> (Len([<<>> EXCEPT ![1] = 0]) \in {LET b8218 == b8217 IN b8217 : b8217 \in (2 .. 2147483647)})])
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 132 to line 14, col 135 of module random_05311
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
