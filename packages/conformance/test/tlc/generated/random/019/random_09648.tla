(*---
description: Evaluates a random int expression, seed 262, number 9648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(3 * 0)) * Cardinality({b14985 \in SUBSET {1} : FALSE})) \div ((([x \in Nat |-> x + 1])[2147483647] * ([a |-> 1, b |-> TRUE]).a) - Len(SubSeq(<<3, 1, 2>>, 2147483647, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09648 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
