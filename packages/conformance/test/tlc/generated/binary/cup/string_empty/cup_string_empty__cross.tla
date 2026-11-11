(*---
description: cup of string_empty, a StringValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_string_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \cup ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_string_empty__cross failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    ""
    and T:
    {<<1, 3>>, <<2, 3>>}
    are not both enumerable
---*)
