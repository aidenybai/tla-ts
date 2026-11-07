(*---
description: Evaluates a random function expression, seed 262, number 2980.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02980 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((-1 % 2147483647) :> (7 * 7)) EXCEPT ![Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a] @@ (LET b4734 == (-1 % 2147483647) IN (-b4734) :> ([[a |-> 1] EXCEPT !.a = @ + <<1, 2>>]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 46 of module random_02980
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
