(*---
description: Evaluates a random set expression, seed 262, number 6612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ [[a |-> 1] EXCEPT !.a = 2147483647]) \subseteq {b10143 \in {b10144 \in {x \in 1..3 : x > 1} : FALSE} : (~b10143)}) \cap (UNION {{3, 2}, ({1, 2} \cap {})} \ DOMAIN ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))))
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
