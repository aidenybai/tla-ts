(*---
description: Evaluates a random seq expression, seed 262, number 3773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q), LAMBDA e : e > 0), LET b5959 == Cardinality((2 .. 0)) IN Head((<<1>> \o [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03773 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Concat(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
