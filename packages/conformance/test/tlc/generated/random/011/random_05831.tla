(*---
description: Evaluates a random seq expression, seed 262, number 5831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((-([a |-> 1]).a) % IF (TRUE \/ FALSE) THEN (0 :> -1) ELSE LET b8987 == 2 IN 2), (([[x \in Nat |-> x + 1] EXCEPT ![-1] = -1])[(2 \div 3)] * CASE (\A b8988 \in {2, 1, 3} : TRUE) -> LET b8989 == 7 IN 3 [] OTHER -> (3 \div 3))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
