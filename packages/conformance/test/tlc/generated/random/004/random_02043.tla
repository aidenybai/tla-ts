(*---
description: Evaluates a random set expression, seed 262, number 2043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b3245 == 2 IN b3245 \div Cardinality({x \in 1..3 : x > 1})) .. Cardinality((2..1 \cap Nat))) \cup (([[x \in 1..2 |-> x] EXCEPT ![-1] = 2])[Head(<<>>)] .. (CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 124 to line 14, col 141 of module random_02043
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02043 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
