(*---
description: Evaluates a random seq expression, seed 262, number 4735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b7401 == ([[a |-> 1] EXCEPT !.a = @ + 2]).a IN (Len(<<3, 1, 2>>) % [<<1, 2>> EXCEPT ![1] = 2]), ([[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = (-1 * 2147483647)]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
