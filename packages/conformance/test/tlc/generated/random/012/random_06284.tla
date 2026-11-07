(*---
description: Evaluates a random function expression, seed 262, number 6284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9668 \in ({LET b9670 == 3 IN 7 : b9669 \in ({1} \cap {})} \cup {(2147483647 .. [x \in 1..2 |-> x]), Len(<<>>)}) |-> CASE (({1, 2} \ {}) \subseteq {7, 3}) -> Cardinality(UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}}) [] OTHER -> ((b9668 :> b9668))[(7 - b9668)]])
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
