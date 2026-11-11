(*---
description: Evaluates a random set expression, seed 262, number 503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b838 == (3 + 7) IN (-3)) : b837 \in {LET b839 == (-1) IN Len(<<3, 1, 2>>), (([x \in Nat |-> x + 1])[2147483647] * ([a |-> 1, b |-> TRUE]).a)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00503 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
