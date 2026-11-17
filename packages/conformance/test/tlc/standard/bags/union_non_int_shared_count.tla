(*---
description: A shared key with non-integer counts hits the cast to IntValue, an unguarded Java cast.
ref: tlc2/module/Bags.java#BagUnion
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
      2105:1 Evaluating assumption line 78, col 8 to line 78, col 11 of module union_non_int_shared_count failed.
      2177:0 Attempted to apply BagUnion to the following set, whose
      element is not a bag:
      {<<"a">>, <<"b">>}
  init:
    exit: 75
    transcript: |-
      1000:1 
      2177:0 Attempted to apply BagUnion to the following set, whose
      element is not a bag:
      {<<"a">>, <<"b">>}
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 79, column 9 to line 79, column 32 in union_non_int_shared_count
      1. Line 79, column 29 to line 79, column 32 in union_non_int_shared_count
      2. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
      3. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2177:0 Attempted to apply BagUnion to the following set, whose
      element is not a bag:
      {<<"a">>, <<"b">>}
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 79, column 9 to line 79, column 32 in union_non_int_shared_count
      1. Line 81, column 8 to line 81, column 32 in union_non_int_shared_count
      2. Line 81, column 29 to line 81, column 32 in union_non_int_shared_count
      3. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
      4. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
  next:
    exit: 255
    transcript: |-
      2177:1 Attempted to apply BagUnion to the following set, whose
      element is not a bag:
      {<<"a">>, <<"b">>}
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 80, column 9 to line 80, column 33 in union_non_int_shared_count
      1. Line 80, column 30 to line 80, column 33 in union_non_int_shared_count
      2. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
      3. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
  property:
    exit: 75
    transcript: |-
      1000:1 
      2177:0 Attempted to apply BagUnion to the following set, whose
      element is not a bag:
      {<<"a">>, <<"b">>}
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 79, column 9 to line 79, column 32 in union_non_int_shared_count
      1. Line 80, column 12 to line 80, column 36 in union_non_int_shared_count
      2. Line 80, column 33 to line 80, column 36 in union_non_int_shared_count
      3. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
      4. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
---*)
---- MODULE union_non_int_shared_count ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({1 :> "a", 1 :> "b"}) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 78, col 8 to line 78, col 11 of module union_non_int_shared_count failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagUnion(tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagUnion(tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 79, column 9 to line 79, column 32 in union_non_int_shared_count
    1. Line 79, column 29 to line 79, column 32 in union_non_int_shared_count
    2. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
    3. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagUnion(tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 80, column 9 to line 80, column 33 in union_non_int_shared_count
    1. Line 80, column 30 to line 80, column 33 in union_non_int_shared_count
    2. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
    3. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagUnion(tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 79, column 9 to line 79, column 32 in union_non_int_shared_count
    1. Line 81, column 8 to line 81, column 32 in union_non_int_shared_count
    2. Line 81, column 29 to line 81, column 32 in union_non_int_shared_count
    3. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
    4. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagUnion(tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 79, column 9 to line 79, column 32 in union_non_int_shared_count
    1. Line 80, column 12 to line 80, column 36 in union_non_int_shared_count
    2. Line 80, column 33 to line 80, column 36 in union_non_int_shared_count
    3. Line 77, column 9 to line 77, column 49 in union_non_int_shared_count
    4. Line 77, column 9 to line 77, column 38 in union_non_int_shared_count
---*)
