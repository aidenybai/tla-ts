(*---
description: Evaluates a random int expression, seed 262, number 2229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(1 - b3504) : b3504 \in (1..3 \ {})}) - Len(SubSeq(Append(<<>>, -1), (7 \in SUBSET {1}), (2147483647 \div 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02229 failed.
    Attempted to check if the non-enumerable value
    7
    is element of
    {{}, {1}}
---*)
