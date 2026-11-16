(*---
description: union_of applied to function_strings, a FcnRcdValue.
ref: tlc2/value/impl/UnionValue.java
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module union_of_function_strings failed.
      2154:0 Attempted to apply the operator overridden by the Java method
      public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
      but it produced the following error:
      Attempted to enumerate the nonenumerable set:
      UNION([a |-> "a", b |-> "b"])
---*)
---- MODULE union_of_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION [x \in {"a", "b"} |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module union_of_function_strings failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate the nonenumerable set:
    tlc2.value.impl.UnionValue$Enumerator@<id>
---*)
