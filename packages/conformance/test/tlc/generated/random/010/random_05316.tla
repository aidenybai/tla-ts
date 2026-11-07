(*---
description: Evaluates a random seq expression, seed 262, number 5316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((<<1, 2>> = [x \in 1..2 |-> x]) \/ (<<5, 6>> @@ [x \in 1..2 |-> x])) -> LET b8223 == (2147483647 % -1) IN Cardinality({1}) [] OTHER -> IF (<<1>> = <<>>) THEN Head(<<1, 2>>) ELSE (CHOOSE b8224 \in {1} : FALSE), IF ([[x \in Nat |-> x + 1] EXCEPT ![2] = 0] @@ [[x \in Nat |-> x + 1] EXCEPT ![7] = -1]) THEN (IF TRUE THEN 0 ELSE 3 + (0 % -1)) ELSE (-([a |-> 1]).a)>>)
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
