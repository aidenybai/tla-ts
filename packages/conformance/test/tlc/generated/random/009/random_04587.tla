(*---
description: Evaluates a random function expression, seed 262, number 4587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7189 \in <<(-(7 * <<>>)), (CASE FALSE -> 1 [] OTHER -> 0 - (3 - 2147483647))>> |-> (Len(Append(<<1>>, b7189)) % Head(Append(<<1, 2>>, 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
