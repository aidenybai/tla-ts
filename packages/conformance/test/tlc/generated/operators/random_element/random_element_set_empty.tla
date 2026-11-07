(*---
description: random_element applied to set_empty, a SetEnumValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Index 0 out of bounds for length 0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Index 0 out of bounds for length 0
---*)
