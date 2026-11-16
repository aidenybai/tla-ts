(*---
description: Evaluates a random int expression, seed 262, number 1428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({([b2283 \in SUBSET {1} |-> 3])[Len(<<1>>)], Cardinality(UNION {SUBSET {1}, 2..1})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01428 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
