(*---
description: Evaluates a random seq expression, seed 262, number 9743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SubSeq(Tail(<<3, 1, 2>>), Len(<<>>), (-2147483647)), LAMBDA e : e > 0) \o SubSeq(SortSeq((<<>> \o <<1>>), LAMBDA p, q : p < q), Cardinality({b15130 \in SUBSET {1} : FALSE}), Cardinality((SUBSET {1} \cap {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09743 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
