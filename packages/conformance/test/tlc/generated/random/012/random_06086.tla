(*---
description: Evaluates a random seq expression, seed 262, number 6086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[<<LET b9372 == 1 IN b9372, Cardinality({2, 1, 3})>> EXCEPT ![1] = ((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) % Cardinality({1}))] EXCEPT ![1] = (([(1 :> 2) EXCEPT ![1] = 1])[LET b9373 == 1 IN 2147483647] + CASE (FALSE => TRUE) -> (0 + 3) [] OTHER -> (2147483647 % Nat))])
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
