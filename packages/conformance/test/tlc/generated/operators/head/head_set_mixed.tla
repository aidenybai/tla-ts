(*---
description: head applied to set_mixed, a SetEnumValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head({1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Head(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Head(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
---*)
