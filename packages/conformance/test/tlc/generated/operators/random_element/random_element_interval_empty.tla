(*---
description: random_element applied to interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(3..1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
---*)
