(*---
description: Evaluates a random set expression, seed 262, number 5073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7892 \in ({b7893 \in ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) : [[x \in Nat |-> x + 1] EXCEPT ![b7893] = b7893]} \cap ((<<3, 1, 2>> \ {}) \cup UNION {2..1, SUBSET {1}})) : (((b7892 .. [a |-> 1]) = {b7894 \in {2, 1, 3} : [a |-> 1]}) => (Head(<<1>>) < (CHOOSE b7895 \in Nat : [a |-> 1])))})
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
