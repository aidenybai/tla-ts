(*---
description: Evaluates a random function expression, seed 262, number 9716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({7 : b15074 \in SUBSET {1}} \ LET b15075 == 1 IN 2)) :> Len(SubSeq(Tail(<<1>>), (2147483647 + 2), Cardinality(SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09716 failed.
    Attempted to check if the value:
    7
    is an element of the integer 2
---*)
