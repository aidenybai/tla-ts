(*---
description: Evaluates a random seq expression, seed 262, number 3431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE (Len(<<1>>) \in {2, 0}) -> (([x \in Nat |-> x + 1])[2] - Cardinality({2, 1, 3})) [] OTHER -> IF ({2, 1, 3} \subseteq {x \in 1..3 : x > 1}) THEN (3 % 3) ELSE Cardinality({}), ((CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE))[((FALSE <=> TRUE) * CASE FALSE -> -1 [] OTHER -> 3)]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03431 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
