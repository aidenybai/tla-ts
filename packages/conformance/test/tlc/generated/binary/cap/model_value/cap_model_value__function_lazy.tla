(*---
description: cap of model_value, a ModelValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE cap_model_value__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \cap ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    mv
    nor T:
    [x \in Nat |-> <expression line 17, col 42 to line 17, col 42 of module cap_model_value__function_lazy>]
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    mv
    nor T:
    [x \in Nat |-> <expression line 17, col 42 to line 17, col 42 of module cap_model_value__function_lazy>]
    is enumerable
---*)
