(*---
description: Evaluates a random bool expression, seed 262, number 5211.
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
      2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module random_05211 failed.
      Attempted to construct a set with too many elements (>1000000).
---*)
---- MODULE random_05211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {2..1, SUBSET {1}} \ ([a |-> 1]).a) = {(CHOOSE r \in [a : {0} \cup {1}] : TRUE) : b8085 \in (7 .. 2147483647)}) <=> (((-1 \div 7) + LET b8086 == 1 IN FALSE) = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a)))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
