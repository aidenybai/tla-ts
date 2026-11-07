(*---
description: Evaluates a random record expression, seed 262, number 9121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) @@ [b14167 \in {2, 1, 3} |-> 2]))[((CHOOSE r \in [a : {1, 2}] : TRUE)).a], b |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [a |-> (0 + 3), b |-> (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)])])
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
