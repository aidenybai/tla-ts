(*---
description: Evaluates a random set expression, seed 262, number 9464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len([<<1, 2>> EXCEPT ![1] = 2147483647]) + Head(SortSeq(<<>>, LAMBDA p, q : p < q))) : b14707 \in {LET b14708 == Head(<<3, 1, 2>>) IN (b14708 - b14708), (-Cardinality(Nat))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09464 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
