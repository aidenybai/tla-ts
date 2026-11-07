(*---
description: Joining integer and string domains fails when @@ checks whether a key is already present, which the TLA+ definition's \in also does.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE at_at_mixed_key_types ----
EXTENDS TLC, Naturals
Test == (1 :> 1) @@ ("a" :> 2) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_mixed_key_types
    1. Line 14, column 29 to line 14, column 32 in at_at_mixed_key_types
    2. Line 12, column 9 to line 12, column 34 in at_at_mixed_key_types
    3. Line 12, column 9 to line 12, column 30 in at_at_mixed_key_types
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in at_at_mixed_key_types
    1. Line 15, column 30 to line 15, column 33 in at_at_mixed_key_types
    2. Line 12, column 9 to line 12, column 34 in at_at_mixed_key_types
    3. Line 12, column 9 to line 12, column 30 in at_at_mixed_key_types
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_mixed_key_types
    1. Line 16, column 8 to line 16, column 32 in at_at_mixed_key_types
    2. Line 16, column 29 to line 16, column 32 in at_at_mixed_key_types
    3. Line 12, column 9 to line 12, column 34 in at_at_mixed_key_types
    4. Line 12, column 9 to line 12, column 30 in at_at_mixed_key_types
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in at_at_mixed_key_types
    1. Line 15, column 12 to line 15, column 36 in at_at_mixed_key_types
    2. Line 15, column 33 to line 15, column 36 in at_at_mixed_key_types
    3. Line 12, column 9 to line 12, column 34 in at_at_mixed_key_types
    4. Line 12, column 9 to line 12, column 30 in at_at_mixed_key_types
---*)
