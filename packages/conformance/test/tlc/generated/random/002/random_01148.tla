(*---
description: Evaluates a random set expression, seed 262, number 1148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat @@ [x \in Nat |-> x + 1]))[(CHOOSE b1838 \in {} : FALSE)] .. Len(<<TRUE, 0>>)) \ {b1839 \in {(1)[0], IF FALSE THEN 3 ELSE 3} : (Cardinality([a |-> 1]) < Cardinality({2, 1, 3}))}))
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
