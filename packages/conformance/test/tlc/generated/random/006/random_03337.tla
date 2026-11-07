(*---
description: Evaluates a random bool expression, seed 262, number 3337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5304 \in (([b5305 \in 2..1 |-> b5305] \cap (3 .. TRUE)) \cap (Cardinality({1, 2}) .. Head(<<1>>))) : (CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (b5304 \div b5304) [] OTHER -> ([a |-> 1] % b5304) \in (DOMAIN (1 :> 2) \cap {3 : b5306 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
