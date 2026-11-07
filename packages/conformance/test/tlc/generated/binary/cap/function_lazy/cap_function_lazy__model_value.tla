(*---
description: cap of function_lazy, a FcnLambdaValue, and model_value, a ModelValue.
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
---- MODULE cap_function_lazy__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in Nat |-> x]) \cap (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    [x \in Nat |-> <expression line 17, col 32 to line 17, col 32 of module cap_function_lazy__model_value>]
    nor T:
    mv
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    [x \in Nat |-> <expression line 17, col 32 to line 17, col 32 of module cap_function_lazy__model_value>]
    nor T:
    mv
    is enumerable
---*)
