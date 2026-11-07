(*---
description: Comparing images of different types fails.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE bag_of_all_mixed_images ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : IF x = 1 THEN 1 ELSE "a", 1 :> 1 @@ 2 :> 1) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_mixed_images
    1. Line 14, column 29 to line 14, column 32 in bag_of_all_mixed_images
    2. Line 12, column 9 to line 12, column 82 in bag_of_all_mixed_images
    3. Line 12, column 9 to line 12, column 71 in bag_of_all_mixed_images
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in bag_of_all_mixed_images
    1. Line 15, column 30 to line 15, column 33 in bag_of_all_mixed_images
    2. Line 12, column 9 to line 12, column 82 in bag_of_all_mixed_images
    3. Line 12, column 9 to line 12, column 71 in bag_of_all_mixed_images
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_mixed_images
    1. Line 16, column 8 to line 16, column 32 in bag_of_all_mixed_images
    2. Line 16, column 29 to line 16, column 32 in bag_of_all_mixed_images
    3. Line 12, column 9 to line 12, column 82 in bag_of_all_mixed_images
    4. Line 12, column 9 to line 12, column 71 in bag_of_all_mixed_images
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_mixed_images
    1. Line 15, column 12 to line 15, column 36 in bag_of_all_mixed_images
    2. Line 15, column 33 to line 15, column 36 in bag_of_all_mixed_images
    3. Line 12, column 9 to line 12, column 82 in bag_of_all_mixed_images
    4. Line 12, column 9 to line 12, column 71 in bag_of_all_mixed_images
---*)
