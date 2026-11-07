(*---
description: cap of record_nested, a RecordValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_record_nested__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \cap ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    [a |-> [b |-> <<1>>]]
    nor T:
    [x \in Nat |-> <expression line 14, col 61 to line 14, col 61 of module cap_record_nested__function_lazy>]
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    [a |-> [b |-> <<1>>]]
    nor T:
    [x \in Nat |-> <expression line 14, col 61 to line 14, col 61 of module cap_record_nested__function_lazy>]
    is enumerable
---*)
