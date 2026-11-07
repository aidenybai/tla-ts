(*---
description: Evaluates a random record expression, seed 262, number 8417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((2147483647 % 1) % (2 :> 2147483647)) - ((CHOOSE r \in [a : 2..1] : TRUE)).a), b |-> (\E b13023 \in {CASE TRUE -> 7 [] OTHER -> [a |-> 1, b |-> TRUE], Len(<<>>)} : (([a |-> 1]).a \in ({1} \ {2, 1, 3})))])
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
