(*---
description: Evaluates a random function expression, seed 262, number 8304.
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
      2105:1 Evaluating assumption line 22, col 8 to line 22, col 11 of module random_08304 failed.
      Attempted to construct a set with too many elements (>1000000).
---*)
---- MODULE random_08304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12852 \in ({CASE FALSE -> 2147483647 [] OTHER -> 2 : b12853 \in (1 .. 2147483647)} \cup ((SUBSET {1} \ 1..3) \cup (1..3 \cup {x \in 1..3 : x > 1}))) |-> Cardinality({(b12852 + b12852), Head(<<3, 1, 2>>)})])
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
