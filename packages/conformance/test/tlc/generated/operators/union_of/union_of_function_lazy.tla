(*---
description: union_of applied to function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE union_of_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION [x \in Nat |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate the nonenumerable set:
    tlc2.value.impl.UnionValue$Enumerator@<id>
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate the nonenumerable set:
    tlc2.value.impl.UnionValue$Enumerator@<id>
---*)
