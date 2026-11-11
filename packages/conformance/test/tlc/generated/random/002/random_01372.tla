(*---
description: Evaluates a random function expression, seed 262, number 1372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (([a |-> 2, b |-> TRUE] - (7 \div 1)) = CASE ([a |-> 1] = [a |-> 1]) -> (0 \div 2) [] OTHER -> (CHOOSE b2189 \in {x \in 1..3 : x > 1} : FALSE)) THEN ((((1 :> 2) @@ (1 :> 2)) @@ (1 :> 1)))[((0 - -1) \div (CHOOSE b2190 \in {x \in 1..3 : x > 1} : TRUE))] ELSE (Cardinality({b2191 \in Nat : FALSE}) * Len(SubSeq(7, 3, 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01372 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
