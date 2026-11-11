(*---
description: cup of record_nested, a RecordValue, and int, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_record_nested__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \cup (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_record_nested__int failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    [a |-> [b |-> <<1>>]]
    and T:
    Int
    are not both enumerable
---*)
