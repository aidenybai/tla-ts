(*---
description: Evaluates a random set expression, seed 262, number 652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Cardinality({2, 3}) % (([a |-> 1] @@ [x \in Nat |-> x + 1]))[CASE FALSE -> 0 [] OTHER -> -1]), CASE (\A b1089 \in {b1090 : b1090 \in SUBSET {1}} : (FALSE <=> TRUE)) -> (CASE TRUE -> [x \in Nat |-> x + 1] [] OTHER -> 2 * (1 \div 0)) [] OTHER -> (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[Tail(<<3, 1, 2>>)]})
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
