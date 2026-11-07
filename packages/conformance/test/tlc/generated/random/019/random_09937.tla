(*---
description: Evaluates a random int expression, seed 262, number 9937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<Len(<<7, 2147483647>>), Cardinality(({2, 1, 3} \cap [a |-> 1, b |-> TRUE]))>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09937 failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
