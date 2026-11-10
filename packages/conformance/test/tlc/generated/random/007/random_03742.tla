(*---
description: Evaluates a random bool expression, seed 262, number 3742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = (3 \div 1)] EXCEPT !.a = ((1 < 2147483647) - (2147483647 - 7))] = [[[[a |-> 1] EXCEPT !.a = 7] EXCEPT !.a = (2 \div 7)] EXCEPT !.a = @ + (LET b5904 == 1 IN -1 \div (2 % -1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03742 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
