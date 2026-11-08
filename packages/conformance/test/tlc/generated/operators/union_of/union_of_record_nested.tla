(*---
description: union_of applied to record_nested, a RecordValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE union_of_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION [a |-> [b |-> <<1>>]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 8 to line 16, col 11 of module union_of_record_nested failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate the nonenumerable set:
    tlc2.value.impl.UnionValue$Enumerator@<id>
---*)
