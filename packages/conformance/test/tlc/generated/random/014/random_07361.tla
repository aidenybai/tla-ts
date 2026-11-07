(*---
description: Evaluates a random set expression, seed 262, number 7361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] - 1) - (7 * [a |-> 1, b |-> TRUE])) .. Cardinality(({1} \cap {2, 1, 3}))) \ UNION {(({2, 1, 3} \cap 1..3) \cap (Nat \cup Nat)), ((2..1 \cap {x \in 1..3 : x > 1}) \cup (1 .. -1))}))
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
