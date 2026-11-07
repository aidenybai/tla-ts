(*---
description: Evaluates a random bool expression, seed 262, number 3596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b5672 \in (([a |-> 1, b |-> TRUE]).a .. (3 % {1, 2})) : ((FALSE => TRUE) = (2147483647 \div 1))) /\ (((2 - 7) < (CHOOSE b5673 \in {x \in 1..3 : x > 1} : FALSE)) \/ (\A b5674 \in {2 : b5675 \in 1..3} : (TRUE /\ [x \in Nat |-> x + 1])))))
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
