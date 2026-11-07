(*---
description: cap of int_zero, a IntValue, and record, a RecordValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int_zero__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \cap ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    0
    nor T:
    [a |-> 1, b |-> 2]
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    0
    nor T:
    [a |-> 1, b |-> 2]
    is enumerable
---*)
