(*---
description: Evaluates a random record expression, seed 262, number 3186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len([<<1>> EXCEPT ![1] = -1]), b |-> ((7 \in 1..3) => (\E b5068 \in {x \in 1..3 : x > 1} : FALSE))] EXCEPT !.a = @ + (LET b5069 == Cardinality({x \in 1..3 : x > 1}) IN Head(<<1>>) % [b5070 \in (2147483647 .. (1 :> 2)) |-> LET b5071 == -1 IN 0])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
