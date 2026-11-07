(*---
description: Evaluates a random set expression, seed 262, number 8878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1) \div (-1 * 1)) * ((-1 - -1) - (0 * 1))) .. ([[<<5, 6>> EXCEPT ![-1] = 1] EXCEPT ![CASE TRUE -> 2 [] OTHER -> 2] = Len(<<1>>)] \div (-CASE TRUE -> 2 [] OTHER -> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 70 to line 14, col 77 of module random_08878
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
