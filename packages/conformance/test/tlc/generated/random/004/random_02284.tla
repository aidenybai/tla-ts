(*---
description: Evaluates a random bool expression, seed 262, number 2284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1}) + (1 * 7)) + ((CHOOSE b3600 \in SUBSET {1} : TRUE) + CASE TRUE -> 3 [] OTHER -> 0)) = CASE ((0 % 2) < ([x \in 1..2 |-> x])[1]) -> IF ({} = SUBSET {1}) THEN (7 = 1) ELSE Len(<<3, 1, 2>>) [] OTHER -> Cardinality(DOMAIN <<5, 6>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02284 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
