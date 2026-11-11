(*---
description: Evaluates a random record expression, seed 262, number 3346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b5312 == IF FALSE THEN 2147483647 ELSE 3 IN (2 * FALSE), b |-> (\E b5313 \in {2147483647, 2} : (b5313 < 0))] EXCEPT !.a = CASE (\A b5314 \in {b5315 : b5315 \in {1, 2}} : (~FALSE)) -> ((-[a |-> 1]) % (CHOOSE b5316 \in Nat : TRUE)) [] OTHER -> CASE (2147483647 < 2147483647) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> ([a |-> 1, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03346 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
