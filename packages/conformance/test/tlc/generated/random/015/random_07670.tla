(*---
description: Evaluates a random record expression, seed 262, number 7670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE (FALSE /\ TRUE) -> (CHOOSE b11808 \in {1, 2} : SUBSET {1}) [] OTHER -> (TRUE % -1) + IF (3 < 2147483647) THEN (0 + 7) ELSE (-1 - 2)), b |-> (((CHOOSE b11809 \in {1} : FALSE) * Len(<<1>>)) < ((3 :> 3) @@ [[x \in Nat |-> x + 1] EXCEPT ![3] = 7]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
