(*---
description: Evaluates a random set expression, seed 262, number 9064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({{b14090 \in {IF FALSE THEN b14089 ELSE -1, CASE FALSE -> -1 [] OTHER -> <<>>} : ((\A b14091 \in {x \in 1..3 : x > 1} : FALSE) /\ (SUBSET {1} \cap Nat))} : b14089 \in CASE ((2 .. FALSE) \subseteq (7 .. 0)) -> (-(1 * 2147483647)) [] OTHER -> (Len(<<3, 1, 2>>) + LET b14092 == 2147483647 IN b14092)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09064 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
