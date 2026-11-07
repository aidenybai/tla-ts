(*---
description: Evaluates a random bool expression, seed 262, number 7497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = @ + {2, 7}]).a < (<<IF TRUE THEN 0 ELSE -1, IF [a |-> 1] THEN 1 ELSE 1>>)[(IF FALSE THEN 7 ELSE 0 % (CHOOSE b11551 \in SUBSET {1} : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
