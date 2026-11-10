(*---
description: Evaluates a random seq expression, seed 262, number 1843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([a |-> Head(SubSeq([x \in Nat |-> x + 1], -1, -1)), b |-> ((-1) < ([x \in Nat |-> x + 1])[-1])], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01843 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.SubSeq(tlc2.value.impl.Value,tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
