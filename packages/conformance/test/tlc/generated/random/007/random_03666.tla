(*---
description: Evaluates a random int expression, seed 262, number 3666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + UNION {{x \in 1..3 : x > 1}, {}}] EXCEPT !.a = @ + (-([x \in Nat |-> x + 1] % 1))] \in (({b5792 \in Nat : FALSE} \cap UNION {{}, SUBSET {1}}) \cap UNION {({1} \cup <<1, 2>>), Head(<<1>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03666 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
