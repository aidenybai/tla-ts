(*---
description: Evaluates a random bool expression, seed 262, number 3639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = [[<<5, 6>> EXCEPT ![0] = 1] EXCEPT ![IF TRUE THEN 0 ELSE 1] = ([a |-> 1]).a]) <=> ((UNION {1..3, {x \in 1..3 : x > 1}} \ {3 : b5750 \in {}}) = {(<<3, 1, 2>> - b5751) : b5751 \in UNION {SUBSET {1}, {1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 92 to line 14, col 99 of module random_03639
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 91 to line 14, col 116 of module random_03639
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03639 failed.
    Attempted to compare the set {} with the value:
    1
---*)
