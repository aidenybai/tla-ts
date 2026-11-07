(*---
description: Evaluates a random int expression, seed 262, number 7000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-1 + 2147483647), ([a |-> 1, b |-> TRUE] - 0)} \cup {CASE FALSE -> -1 [] OTHER -> b10725 : b10725 \in {b10726 : b10726 \in SUBSET {1}}}) \cap DOMAIN ((CHOOSE b10727 \in Nat : TRUE) :> ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
