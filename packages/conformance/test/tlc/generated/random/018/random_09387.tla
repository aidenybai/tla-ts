(*---
description: Evaluates a random seq expression, seed 262, number 9387.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09387 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[Append(Append(<<1>>, 3), (0 \div 3)) EXCEPT ![1] = (Len(<<3, 1, 2>>) % [b14564 \in 1..3 |-> b14564])] EXCEPT ![1] = Len(<<LET b14565 == 2 IN 7, Cardinality({})>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
