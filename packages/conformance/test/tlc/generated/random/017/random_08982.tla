(*---
description: Evaluates a random bool expression, seed 262, number 8982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Cardinality({x \in 1..3 : x > 1}) % (2 % 7)), (-Head(<<1, 2>>))} \subseteq UNION {(([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) \ ({x \in 1..3 : x > 1} .. 2147483647)), ([<<5, 6>> EXCEPT ![7] = 2] \ ({1, 2} \ {2, 1, 3}))}))
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
