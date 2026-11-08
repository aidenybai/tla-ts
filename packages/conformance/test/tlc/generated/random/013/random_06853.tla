(*---
description: Evaluates a random seq expression, seed 262, number 6853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((SortSeq([<<>> EXCEPT ![1] = 1], LAMBDA p, q : p < q) \o SubSeq([b10509 \in Nat |-> b10509], ((1 :> 2))[1], (2147483647 .. 2147483647))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 37 of module random_06853
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06853 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.SubSeq(tlc2.value.impl.Value,tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
