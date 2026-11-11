(*---
description: Evaluates a random set expression, seed 262, number 8957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(Len(<<1, 2>>) - CASE [a |-> 1] -> 2147483647 [] OTHER -> 1) : b13893 \in DOMAIN [(1 :> 2) EXCEPT ![2147483647] = 7]}, {(<<2, 0>> * ([a |-> 1, b |-> TRUE]).a), Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 107 to line 14, col 112 of module random_08957
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08957 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 46 to line 14, col 54 of module random_08957
---*)
