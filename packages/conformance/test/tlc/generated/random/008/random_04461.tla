(*---
description: Evaluates a random seq expression, seed 262, number 4461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SubSeq([<<1, 2>> EXCEPT ![1] = 2147483647], ([a |-> 1]).a, ([a |-> 1, b |-> TRUE]).a) \o [b7020 \in {-1, 2147483647} |-> (3 % [a |-> 1, b |-> TRUE])]) EXCEPT ![1] = ([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = IF TRUE THEN -1 ELSE 1]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
