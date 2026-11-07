(*---
description: subset_of applied to function_strings, a FcnRcdValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET [x \in {"a", "b"} |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the value of an expression of form
    SUBSET S, but S is a non-enumerable value:
    [a |-> "a", b |-> "b"]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the value of an expression of form
    SUBSET S, but S is a non-enumerable value:
    [a |-> "a", b |-> "b"]
---*)
