(*---
description: Evaluates a random set expression, seed 262, number 5058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = @ + CASE TRUE -> 0 [] OTHER -> 2147483647] \div Len(Tail(<<1, 2>>))), (CHOOSE f \in [2..1 -> {}] : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
