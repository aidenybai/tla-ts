(*---
description: Evaluates a random set expression, seed 262, number 2937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality((3 .. b4649)) : b4649 \in ((1 .. 2147483647) \cup ({} \ {2, 1, 3}))} \cup {((b4650 + -1) % (3 * b4650)) : b4650 \in UNION {(2147483647 .. 7), {b4651 : b4651 \in 1..3}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02937 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)
