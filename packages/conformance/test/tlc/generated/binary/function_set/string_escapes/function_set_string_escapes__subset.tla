(*---
description: function_set of string_escapes, a StringValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_string_escapes__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([("a\"b\\c\n") -> (SUBSET {1, 2})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module function_set_string_escapes__subset failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Shouldn't call isEmpty() on value "a\"b\\c\n"
---*)
