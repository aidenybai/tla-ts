(*---
description: Evaluates a random int expression, seed 262, number 292.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00292 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b488 == ((CHOOSE f \in [{1, 2} -> {1}] : TRUE))[Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))] IN (((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))[Cardinality({x \in 1..3 : x > 1})] - (Head(<<>>) + (CHOOSE b489 \in {x \in 1..3 : x > 1} : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00292 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
