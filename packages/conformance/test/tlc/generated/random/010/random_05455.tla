(*---
description: Evaluates a random function expression, seed 262, number 5455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8446 \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] - ([a |-> 1, b |-> TRUE]).a) .. Len((<<>> \o <<3, 1, 2>>))) |-> Len(Append(Append(<<>>, b8446), LET b8447 == 0 IN b8446))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
