(*---
description: Evaluates a random function expression, seed 262, number 8303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12849 \in {CASE (\E b12850 \in {x \in 1..3 : x > 1} : TRUE) -> (3 \div FALSE) [] OTHER -> (CHOOSE b12851 \in SUBSET {1} : TRUE), CASE (1..3 = 2..1) -> (7 - 2147483647) [] OTHER -> Cardinality({x \in 1..3 : x > 1})} |-> (-Head(Tail(<<3, 1, 2>>)))])
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
