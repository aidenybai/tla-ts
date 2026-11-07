(*---
description: Evaluates a random int expression, seed 262, number 33.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) = ((Nat \cup {x \in 1..3 : x > 1}) + ([a |-> 1]).a)) -> Cardinality(UNION {{1, 2147483647}, (2..1 \cap 1..3)}) [] OTHER -> ([b51 \in (CHOOSE f \in [2..1 -> {1}] : TRUE) |-> (-b51)])[Cardinality(([x \in 1..2 |-> x] \ 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
---*)
