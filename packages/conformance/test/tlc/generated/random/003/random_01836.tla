(*---
description: Evaluates a random record expression, seed 262, number 1836.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01836 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Append(<<1, 2>>, 3) \o [<<1, 2>> EXCEPT ![1] = 7]) \o [<<3, 2147483647>> EXCEPT ![1] = (<<3, 1, 2>> \o <<>>)]), b |-> (((<<1>> % 0) \div LET b2908 == <<>> IN b2908) = ((7 - [x \in 1..2 |-> x]) \div CASE TRUE -> 0 [] OTHER -> 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
