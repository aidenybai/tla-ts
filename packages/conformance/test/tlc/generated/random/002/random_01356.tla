(*---
description: Evaluates a random function expression, seed 262, number 1356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([((1 :> 2) @@ [x \in Nat |-> x + 1]) EXCEPT ![(7 \div 2)] = Len(<<3, 1, 2>>)] @@ [[b2162 \in 2..1 |-> b2162] EXCEPT ![SubSeq(<<1, 2>>, 2, {1})] = Cardinality({1, 2})]) EXCEPT ![Len(SelectSeq((<<1, 2>> \o <<1>>), LAMBDA e : e > 0))] = Head([<<SUBSET {1}, {2, 1, 3}>> EXCEPT ![1] = (-1 - 0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
