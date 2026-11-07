(*---
description: Evaluates a random bool expression, seed 262, number 3195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(<<2147483647, 2>>, LAMBDA p, q : p < q), (CASE FALSE -> 2147483647 [] OTHER -> -1 + (0 + [a |-> 1, b |-> TRUE]))) = [[[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = IF TRUE THEN 0 ELSE 2147483647] EXCEPT !.a = LET b5078 == Len(<<1, 2>>) IN (b5078 - b5078)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
