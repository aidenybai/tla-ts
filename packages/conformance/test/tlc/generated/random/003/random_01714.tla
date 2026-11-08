(*---
description: Evaluates a random int expression, seed 262, number 1714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o <<Cardinality(TRUE), (2147483647 + 1)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01714 failed.
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
