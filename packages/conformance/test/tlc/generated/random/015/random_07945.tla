(*---
description: Evaluates a random function expression, seed 262, number 7945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 % TRUE) \in [(1 :> 2) EXCEPT ![-1] = -1]) * IF (~TRUE) THEN (3 % -1) ELSE (CHOOSE b12267 \in SUBSET {1} : TRUE)) :> (CHOOSE b12268 \in {LET b12270 == 3 IN 0 : b12269 \in UNION {{}, {}}} : ((TRUE + 7) \in (7 .. b12268)))))
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
