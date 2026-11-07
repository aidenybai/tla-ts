(*---
description: Normalizing the result of mixed node types fails to compare an integer with a string.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: evaluation-failure
includes:
  - TransitiveClosure.tla
---*)
---- MODULE mixed_node_types_two_edges_fail ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, "a">>, <<"a", 2>>}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in mixed_node_types_two_edges_fail
    1. Line 16, column 29 to line 16, column 32 in mixed_node_types_two_edges_fail
    2. Line 14, column 9 to line 14, column 47 in mixed_node_types_two_edges_fail
    3. Line 14, column 9 to line 14, column 42 in mixed_node_types_two_edges_fail
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in mixed_node_types_two_edges_fail
    1. Line 17, column 30 to line 17, column 33 in mixed_node_types_two_edges_fail
    2. Line 14, column 9 to line 14, column 47 in mixed_node_types_two_edges_fail
    3. Line 14, column 9 to line 14, column 42 in mixed_node_types_two_edges_fail
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in mixed_node_types_two_edges_fail
    1. Line 18, column 8 to line 18, column 32 in mixed_node_types_two_edges_fail
    2. Line 18, column 29 to line 18, column 32 in mixed_node_types_two_edges_fail
    3. Line 14, column 9 to line 14, column 47 in mixed_node_types_two_edges_fail
    4. Line 14, column 9 to line 14, column 42 in mixed_node_types_two_edges_fail
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TransitiveClosure.Warshall(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in mixed_node_types_two_edges_fail
    1. Line 17, column 12 to line 17, column 36 in mixed_node_types_two_edges_fail
    2. Line 17, column 33 to line 17, column 36 in mixed_node_types_two_edges_fail
    3. Line 14, column 9 to line 14, column 47 in mixed_node_types_two_edges_fail
    4. Line 14, column 9 to line 14, column 42 in mixed_node_types_two_edges_fail
---*)
