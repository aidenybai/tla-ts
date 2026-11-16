(*---
description: Evaluates a random set expression, seed 262, number 5347.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05347 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LET b8263 == -1 IN b8263, (2147483647 - 7))) : b8262 \in (({b8264 \in SUBSET {1} : FALSE} \cap ({1, 2} \ {})) \cap UNION {(-1 .. 3), (-1 .. 3)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05347 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
