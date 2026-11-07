(*---
description: Evaluates a random int expression, seed 262, number 668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((Len(<<3, 1, 2>>) \div (7 \div TRUE)) < (([x \in Nat |-> x + 1])[7] + (CHOOSE b1113 \in {1} : FALSE))) THEN Len(SubSeq(SubSeq(<<3, 1, 2>>, 1, 7), ((1 :> 2) @@ [x \in 1..2 |-> x]), ([a |-> 1, b |-> TRUE]).a)) ELSE Head(((<<>> \o <<>>) \o [<<3, 1, 2>> EXCEPT ![1] = 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
