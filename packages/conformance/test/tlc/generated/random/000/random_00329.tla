(*---
description: Evaluates a random function expression, seed 262, number 329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b555 \in {b556 \in (([x \in 1..2 |-> x])[2] .. (CHOOSE b557 \in SUBSET {1} : TRUE)) : (Head(<<>>) < LET b558 == b556 IN -1)} |-> (((b555 :> -1))[(2 - 2147483647)] * IF (b555 \in 2..1) THEN ([a |-> 1]).a ELSE ({} \cup {2, 1, 3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00329 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
