(*---
description: Evaluates a random record expression, seed 262, number 7372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 % <<5, 6>>), b |-> (\E b11345 \in Nat : FALSE)] EXCEPT !.a = @ + IF (1 = 1) THEN {b11346 \in 1..3 : FALSE} ELSE (2147483647 * 2)] EXCEPT !.a = ((CHOOSE b11347 \in DOMAIN <<5, 6>> : (\A b11348 \in 1..3 : FALSE)) + (CHOOSE b11349 \in DOMAIN (1 :> 2) : (\A b11350 \in {1, 2} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07372 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
