(*---
description: Evaluates a random seq expression, seed 262, number 3715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((\E b5872 \in {} : FALSE) \/ (<<5, 6>> @@ [x \in Nat |-> x + 1])) -> IF (<<3, 1, 2>> = [x \in Nat |-> x + 1]) THEN ([a |-> 1]).a ELSE IF FALSE THEN 0 ELSE 3 [] OTHER -> IF (~TRUE) THEN Head(<<1, 2>>) ELSE IF FALSE THEN 0 ELSE 3, IF (Len(<<3, 1, 2>>) < Len(<<1>>)) THEN CASE (FALSE \/ <<1>>) -> ({2, 1, 3})[0] [] OTHER -> {2, 1} ELSE Head(SelectSeq(<<1>>, LAMBDA e : e > 0))>>)
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
