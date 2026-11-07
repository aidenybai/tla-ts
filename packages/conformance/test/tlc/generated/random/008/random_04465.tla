(*---
description: Evaluates a random int expression, seed 262, number 4465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((FALSE * 2) => (\E b7022 \in {2, 1, 3} : TRUE)) <=> (\A b7023 \in DOMAIN (1 :> 2) : CASE TRUE -> b7023 [] OTHER -> b7023)) -> (CHOOSE b7024 \in ({b7025 \in {x \in 1..3 : x > 1} : TRUE} \subseteq {7, 7}) : (SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) = [[x \in Nat |-> x + 1] EXCEPT ![b7024] = 1])) [] OTHER -> IF ({2147483647 : b7026 \in {1, 2}} = Len(<<3, 1, 2>>)) THEN ((<<5, 6>>)[1] - (-1 + 7)) ELSE ((-<<5, 6>>) - CASE FALSE -> 0 [] OTHER -> 7))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
