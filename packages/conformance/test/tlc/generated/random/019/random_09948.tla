(*---
description: Evaluates a random int expression, seed 262, number 9948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((CHOOSE b15473 \in SUBSET {1} : TRUE) = (<<>> % 2)) THEN ([b15474 \in SUBSET {1} |-> 1])[(CHOOSE b15475 \in Nat : TRUE)] ELSE IF (TRUE \/ TRUE) THEN (2 - 2147483647) ELSE (2 % 2) * (((2147483647 :> 7))[Len(<<>>)] - Head([<<>> EXCEPT ![1] = 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
