(*---
description: Evaluates a random record expression, seed 262, number 2737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Head([x \in Nat |-> x + 1]) - (2 \div 0)), b |-> (Len(<<1>>) = Cardinality(Nat))] EXCEPT !.a = (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) \in {(CHOOSE b4320 \in SUBSET {1} : FALSE), CASE FALSE -> 7 [] OTHER -> -1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Head(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Head(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
