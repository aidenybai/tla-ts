(*---
description: Evaluates a random seq expression, seed 262, number 5596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(<<Head(<<>>), {b8665 : b8665 \in Nat}>>, LAMBDA p, q : p < q), ([[<<5, 6>> EXCEPT ![2147483647] = 2147483647] EXCEPT ![((1 :> 2))[3]] = (2147483647 \div 2147483647)])[Cardinality(UNION {{2, 1, 3}, {}})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05596 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
