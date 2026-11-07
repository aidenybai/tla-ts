(*---
description: Evaluates a random bool expression, seed 262, number 8210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), Head(<<1, 2>>)) = (Cardinality({x \in 1..3 : x > 1}) :> ({x \in 1..3 : x > 1} + 7))) \/ ((CHOOSE b12708 \in {7, 0} : (<<3, 1, 2>> = [x \in 1..2 |-> x])) \in [[[x \in Nat |-> x + 1] EXCEPT ![FALSE] = 2147483647] EXCEPT ![LET b12709 == 7 IN b12709] = ((1 :> 2))[2147483647]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
