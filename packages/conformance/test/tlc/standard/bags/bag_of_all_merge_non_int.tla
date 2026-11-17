(*---
description: A merge of non-integer counts hits the unguarded cast to IntValue.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module bag_of_all_merge_non_int failed.
      2169:0 The second argument of BagOfAll should be a bag, but instead it is:
      <<"a", "b">>
  init:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of BagOfAll should be a bag, but instead it is:
      <<"a", "b">>
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in bag_of_all_merge_non_int
      1. Line 74, column 29 to line 74, column 32 in bag_of_all_merge_non_int
      2. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
      3. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of BagOfAll should be a bag, but instead it is:
      <<"a", "b">>
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in bag_of_all_merge_non_int
      1. Line 76, column 8 to line 76, column 32 in bag_of_all_merge_non_int
      2. Line 76, column 29 to line 76, column 32 in bag_of_all_merge_non_int
      3. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
      4. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
  next:
    exit: 255
    transcript: |-
      2169:1 The second argument of BagOfAll should be a bag, but instead it is:
      <<"a", "b">>
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 33 in bag_of_all_merge_non_int
      1. Line 75, column 30 to line 75, column 33 in bag_of_all_merge_non_int
      2. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
      3. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
  property:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of BagOfAll should be a bag, but instead it is:
      <<"a", "b">>
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in bag_of_all_merge_non_int
      1. Line 75, column 12 to line 75, column 36 in bag_of_all_merge_non_int
      2. Line 75, column 33 to line 75, column 36 in bag_of_all_merge_non_int
      3. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
      4. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
---*)
---- MODULE bag_of_all_merge_non_int ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x * 0, 1 :> "a" @@ 2 :> "b") = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module bag_of_all_merge_non_int failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in bag_of_all_merge_non_int
    1. Line 74, column 29 to line 74, column 32 in bag_of_all_merge_non_int
    2. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
    3. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 75, column 9 to line 75, column 33 in bag_of_all_merge_non_int
    1. Line 75, column 30 to line 75, column 33 in bag_of_all_merge_non_int
    2. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
    3. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in bag_of_all_merge_non_int
    1. Line 76, column 8 to line 76, column 32 in bag_of_all_merge_non_int
    2. Line 76, column 29 to line 76, column 32 in bag_of_all_merge_non_int
    3. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
    4. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagOfAll(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in bag_of_all_merge_non_int
    1. Line 75, column 12 to line 75, column 36 in bag_of_all_merge_non_int
    2. Line 75, column 33 to line 75, column 36 in bag_of_all_merge_non_int
    3. Line 72, column 9 to line 72, column 67 in bag_of_all_merge_non_int
    4. Line 72, column 9 to line 72, column 56 in bag_of_all_merge_non_int
---*)
