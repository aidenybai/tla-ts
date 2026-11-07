(*---
description: Evaluates a random set expression, seed 262, number 3174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len((CHOOSE r \in [a : {0} \cup {1}] : TRUE)) : b5056 \in (([a |-> 1] \div 3) .. ((1 :> 2))[2147483647])} \cap UNION {([a |-> 0, b |-> FALSE] \cup {3, -1}), ({{1}, 0} \cap ({x \in 1..3 : x > 1} \cup {1, 2}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
