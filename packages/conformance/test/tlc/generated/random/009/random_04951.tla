(*---
description: Evaluates a random function expression, seed 262, number 4951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7700 \in (({[x \in 1..2 |-> x] : b7701 \in {2, 1, 3}} \cup DOMAIN <<>>) \cup DOMAIN ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x])) |-> (-LET b7702 == LET b7703 == b7700 IN 7 IN (-b7702))])
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
