(*---
description: Evaluates a random bool expression, seed 262, number 1234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + IF (TRUE \/ TRUE) THEN ([a |-> 1] * 2147483647) ELSE ([a |-> 1, b |-> TRUE]).a] = [[a |-> Cardinality(SUBSET {1}), b |-> (2 = <<5, 6>>)] EXCEPT !.a = (Len(<<3, 1, 2>>) % ([x \in 1..2 |-> x])[3])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
