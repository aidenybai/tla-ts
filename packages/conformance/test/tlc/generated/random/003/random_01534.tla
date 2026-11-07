(*---
description: Evaluates a random function expression, seed 262, number 1534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ <<5, 6>>)))[(CHOOSE b2438 \in {2147483647 : b2439 \in {x \in 1..3 : x > 1}} : (b2438 = 3))] :> Len([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = Cardinality(Nat)])))
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
