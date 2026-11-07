(*---
description: Evaluates a random function expression, seed 262, number 835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((<<5, 6>> @@ <<5, 6>>) @@ [[x \in Nat |-> x + 1] EXCEPT ![7] = 2147483647]) @@ ((CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) @@ [2147483647 EXCEPT ![2147483647] = 1])) EXCEPT ![(CHOOSE b1359 \in IF [a |-> 7, b |-> FALSE] THEN IF [x \in 1..2 |-> x] THEN 7 ELSE 3 ELSE (-1 + {2, 1, 3}) : ([a |-> b1359, b |-> TRUE] /\ (\E b1360 \in {1, 2} : FALSE)))] = (Cardinality(DOMAIN [x \in 1..2 |-> x]) + CASE (TRUE \/ FALSE) -> Head(<<3, 1, 2>>) [] OTHER -> CASE TRUE -> TRUE [] OTHER -> 2147483647)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
