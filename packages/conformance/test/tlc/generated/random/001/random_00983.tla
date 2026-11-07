(*---
description: Evaluates a random function expression, seed 262, number 983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1579 \in (UNION {{0 : b1580 \in {x \in 1..3 : x > 1}}, {7, 3}} \cap DOMAIN ([x \in Nat |-> x + 1] @@ <<5, 6>>)) |-> Len(Tail(SubSeq(<<1, 2>>, -1, b1579)))])
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
