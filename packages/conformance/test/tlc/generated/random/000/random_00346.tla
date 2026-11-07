(*---
description: Evaluates a random seq expression, seed 262, number 346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([SelectSeq((<<3, 1, 2>> \o <<>>), LAMBDA e : e > 0) EXCEPT ![1] = IF ([a |-> 1, b |-> TRUE] \in {1, 2}) THEN (1 \div 1) ELSE Cardinality({x \in 1..3 : x > 1})], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00346 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
