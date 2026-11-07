(*---
description: "TLC binds the Java Append by name without comparing arity, so applying the replacing file's one-parameter Append fails in evaluation."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
includes: [Sequences.tla]
outcome: evaluation-failure
---*)
---- MODULE java_bound_with_wrong_arity ----
EXTENDS Sequences
ASSUME Append(1) = 44
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Append(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    array is not of length 2
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Append(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    array is not of length 2
---*)
