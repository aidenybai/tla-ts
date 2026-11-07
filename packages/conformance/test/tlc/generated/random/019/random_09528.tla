(*---
description: Evaluates a random function expression, seed 262, number 9528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[x \in 1..2 |-> x] EXCEPT ![2] = 1] @@ ([x \in Nat |-> x + 1] @@ (1 :> 2))) @@ (CASE FALSE -> 2147483647 [] OTHER -> 2 :> Head(<<3, 1, 2>>))) EXCEPT ![([a |-> Head(<<1>>), b |-> (<<1>> = <<5, 6>>)]).a] = (LET b14804 == ([a |-> 1, b |-> TRUE]).a IN (CHOOSE b14805 \in 2..1 : FALSE) + ({7 : b14806 \in {}} \ ({1} \cup {x \in 1..3 : x > 1})))])
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
