(*---
description: Evaluates a random seq expression, seed 262, number 9168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(2 :> 0) EXCEPT ![Head(<<>>)] = Len(<<1>>)] EXCEPT ![Head(SortSeq(<<>>, LAMBDA p, q : p < q))] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a] EXCEPT ![Cardinality(((CHOOSE b14235 \in SUBSET {1} : b14235) .. (-1 + 7)))] = ((CHOOSE r \in [a : {}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09168 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
