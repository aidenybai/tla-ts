(*---
description: Evaluates a random function expression, seed 262, number 2628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b4142 \in (Tail(<<1, 2>>) .. LET b4143 == {2, 1, 3} IN b4143) |-> Head(<<1, 2>>)] EXCEPT ![(CASE (\E b4144 \in SUBSET {1} : TRUE) -> Cardinality(2..1) [] OTHER -> Len(<<3, 1, 2>>) - CASE (FALSE <=> TRUE) -> (-1 * 2) [] OTHER -> Head(<<1>>))] = ((Cardinality({}) + ([x \in 1..2 |-> x])[0]) \div Cardinality(({2, 1, 3} \ SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
