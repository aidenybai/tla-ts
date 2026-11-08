(*---
description: Evaluates a random bool expression, seed 262, number 2771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 = 7) \/ (2 < -1)) <=> ((<<5, 6>> @@ [x \in Nat |-> x + 1]) < (2 % 7))) => (CASE (2147483647 \in {2, 1, 3}) -> (2147483647 \div 7) [] OTHER -> Cardinality({1, 2}) \in (IF FALSE THEN -1 ELSE 3 .. (CHOOSE b4377 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02771 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
