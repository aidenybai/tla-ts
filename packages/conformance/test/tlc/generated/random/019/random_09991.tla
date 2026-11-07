(*---
description: Evaluates a random function expression, seed 262, number 9991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15529 \in {b15530 \in {(b15531 + b15531) : b15531 \in {b15532 : b15532 \in SUBSET {1}}} : (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (~FALSE))} |-> Len(Append([<<3, 1, 2>> EXCEPT ![1] = b15529], (7 + [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
