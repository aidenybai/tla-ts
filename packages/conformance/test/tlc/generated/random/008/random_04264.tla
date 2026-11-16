(*---
description: Evaluates a random seq expression, seed 262, number 4264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = 3] \cap ([[a |-> 1] EXCEPT !.a = @ + 3] .. IF FALSE THEN 3 ELSE TRUE)) = DOMAIN [b6712 \in UNION {{1}, 2..1} |-> CASE FALSE -> -1 [] OTHER -> 2147483647]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 43 of module random_04264
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04264 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
