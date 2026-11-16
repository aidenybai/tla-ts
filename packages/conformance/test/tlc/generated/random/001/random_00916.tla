(*---
description: Evaluates a random int expression, seed 262, number 916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE SubSeq(Tail(Append((1 :> 2), 1..3)), ((TRUE \div 2147483647) \div IF TRUE THEN -1 ELSE 2), (-IF TRUE THEN 2147483647 ELSE 1)) -> IF ((<<1, 2>> = [x \in Nat |-> x + 1]) <=> (3 \in {2, 1, 3})) THEN ((CHOOSE b1475 \in {2, 1, 3} : FALSE) - (CHOOSE b1476 \in {x \in 1..3 : x > 1} : {1, 2})) ELSE ([b1477 \in 1..3 |-> b1477])[([x \in Nat |-> x + 1])[<<5, 6>>]] [] OTHER -> ((CHOOSE f \in [2..1 -> 1..2] : TRUE))[CASE (\E b1478 \in SUBSET {1} : TRUE) -> Cardinality(1..3) [] OTHER -> CASE FALSE -> 2147483647 [] OTHER -> {1}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00916 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
