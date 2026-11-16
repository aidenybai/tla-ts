(*---
description: Evaluates a random function expression, seed 262, number 5543.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05543 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8574 \in {Head(<<3, 2147483647>>), ((-2147483647) - LET b8575 == 2 IN <<3, 1, 2>>)} |-> (Len((<<3, 1, 2>> \o <<3, 1, 2>>)) * ([a |-> 7, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05543 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
