(*---
description: Evaluates a random int expression, seed 262, number 927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1493 \in ({Cardinality(SUBSET {1}), LET b1494 == <<>> IN b1494} \cup ((2 .. 7) \ (1 .. 3))) : ((~(TRUE => TRUE)) => ((2147483647 < b1493) \/ (1 \in <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00927 failed.
    Attempted to check equality of the function <<>> with the value:
    4
---*)
