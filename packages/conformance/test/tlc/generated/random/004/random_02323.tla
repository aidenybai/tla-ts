(*---
description: Evaluates a random set expression, seed 262, number 2323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([b3680 \in (-1 .. 2147483647) |-> (<<5, 6>>)[-1]] @@ [b3681 \in {3, 0} |-> (b3681 - b3681)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02323 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
