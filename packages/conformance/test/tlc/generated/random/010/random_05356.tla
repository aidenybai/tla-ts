(*---
description: Evaluates a random set expression, seed 262, number 5356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 7 ELSE 7 % CASE TRUE -> 2 [] OTHER -> 1) % LET b8283 == CASE FALSE -> 7 [] OTHER -> -1 IN {b8283, 1}) .. LET b8284 == (CHOOSE b8285 \in ({} \ {}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])) IN (CASE TRUE -> 3 [] OTHER -> 1 \div Cardinality(2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
