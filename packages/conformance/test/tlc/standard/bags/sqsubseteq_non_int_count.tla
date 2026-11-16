(*---
description: A non-integer count hits the unguarded cast to IntValue.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE sqsubseteq_non_int_count ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> "a") \sqsubseteq EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module sqsubseteq_non_int_count failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.SqSubseteq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.SqSubseteq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sqsubseteq_non_int_count
    1. Line 14, column 29 to line 14, column 32 in sqsubseteq_non_int_count
    2. Line 12, column 9 to line 12, column 39 in sqsubseteq_non_int_count
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.SqSubseteq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in sqsubseteq_non_int_count
    1. Line 15, column 30 to line 15, column 33 in sqsubseteq_non_int_count
    2. Line 12, column 9 to line 12, column 39 in sqsubseteq_non_int_count
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.SqSubseteq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sqsubseteq_non_int_count
    1. Line 16, column 8 to line 16, column 32 in sqsubseteq_non_int_count
    2. Line 16, column 29 to line 16, column 32 in sqsubseteq_non_int_count
    3. Line 12, column 9 to line 12, column 39 in sqsubseteq_non_int_count
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.SqSubseteq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in sqsubseteq_non_int_count
    1. Line 15, column 12 to line 15, column 36 in sqsubseteq_non_int_count
    2. Line 15, column 33 to line 15, column 36 in sqsubseteq_non_int_count
    3. Line 12, column 9 to line 12, column 39 in sqsubseteq_non_int_count
---*)
