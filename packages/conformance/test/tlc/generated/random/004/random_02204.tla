(*---
description: Evaluates a random function expression, seed 262, number 2204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(1 :> -1) EXCEPT ![LET b3462 == 2147483647 IN -1] = (-2)] EXCEPT ![Len(SubSeq(<<3, 1, 2>>, 1, 3))] = (CHOOSE b3463 \in {b3464 \in 1..3 : TRUE} : (\E b3465 \in Nat : TRUE))] @@ (((CHOOSE f \in [{} -> {1, 2}] : TRUE) @@ (2 :> 0)) @@ ((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))[([a |-> 1] + 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 26 of module random_02204
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 75 of module random_02204
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
