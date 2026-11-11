(*---
description: Evaluates a random seq expression, seed 262, number 6124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((IF FALSE THEN -1 ELSE FALSE \div CASE FALSE -> 0 [] OTHER -> 1) + LET b9425 == (<<5, 6>> * 0) IN Head(<<3, 1, 2>>)), (Head(Tail(<<>>)) \div ((1..3 % 2147483647) + ([a |-> 1, b |-> TRUE]).a))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06124 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
