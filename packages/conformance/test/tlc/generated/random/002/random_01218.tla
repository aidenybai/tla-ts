(*---
description: Evaluates a random function expression, seed 262, number 1218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) EXCEPT ![Len(<<3, 1, 2>>)] = Head(<<3, 1, 2>>)] EXCEPT ![(([a |-> 1]).a - (1 - FALSE))] = CASE (TRUE => TRUE) -> CASE FALSE -> 0 [] OTHER -> 0 [] OTHER -> (-1 - 2)] EXCEPT ![(CHOOSE b1955 \in {(3 % b1956) : b1956 \in (3 .. 7)} : ((FALSE /\ TRUE) \/ (TRUE => FALSE)))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = (-7)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 61 of module random_01218
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
