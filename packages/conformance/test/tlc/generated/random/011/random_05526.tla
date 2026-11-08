(*---
description: Evaluates a random record expression, seed 262, number 5526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([<<5, 6>> EXCEPT ![0] = 1])[Len(0)], b |-> (SortSeq(<<1>>, LAMBDA p, q : p < q) = [(1 :> 2) EXCEPT ![0] = 7])] EXCEPT !.a = @ + ((CHOOSE b8548 \in (SUBSET {1} \cap 2..1) : (b8548 \in {1})) \div LET b8549 == (-1 * 7) IN Len(<<1>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 33 of module random_05526
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05526 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    0
---*)
