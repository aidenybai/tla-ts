(*---
description: Evaluates a random int expression, seed 262, number 6198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([b9544 \in 1..3 |-> b9544])[(0 % FALSE)]) % CASE (\E b9545 \in (-1 .. 2147483647) : (Nat \subseteq 1..3)) -> Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) [] OTHER -> IF ({} \subseteq Nat) THEN (<<5, 6>>)[2] ELSE IF TRUE THEN 2147483647 ELSE 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
