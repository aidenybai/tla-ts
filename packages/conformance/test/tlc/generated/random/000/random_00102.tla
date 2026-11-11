(*---
description: Evaluates a random set expression, seed 262, number 102.
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
      2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module random_00102 failed.
      In applying the function
      <<1, 2>>,
      the first argument is:
      21
      which is not in its domain.
---*)
---- MODULE random_00102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b158 \in ((7 * 3) .. IF FALSE THEN -1 ELSE 2147483647) |-> ((7 * b158) - ([x \in 1..2 |-> x])[b158])])
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
