(*---
description: TLCFP of Nat has no fingerprint.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE fp_infinite ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP(Nat) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in fp_infinite
    1. Line 14, column 29 to line 14, column 32 in fp_infinite
    2. Line 12, column 9 to line 12, column 22 in fp_infinite
    3. Line 12, column 9 to line 12, column 18 in fp_infinite
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in fp_infinite
    1. Line 15, column 30 to line 15, column 33 in fp_infinite
    2. Line 12, column 9 to line 12, column 22 in fp_infinite
    3. Line 12, column 9 to line 12, column 18 in fp_infinite
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in fp_infinite
    1. Line 16, column 8 to line 16, column 32 in fp_infinite
    2. Line 16, column 29 to line 16, column 32 in fp_infinite
    3. Line 12, column 9 to line 12, column 22 in fp_infinite
    4. Line 12, column 9 to line 12, column 18 in fp_infinite
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.IntValue tlc2.module.TLCExt.tlcFingerprint(tlc2.value.impl.Value),
    but it produced the following error:
    TLC has found a state in which the value of a variable contains Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in fp_infinite
    1. Line 15, column 12 to line 15, column 36 in fp_infinite
    2. Line 15, column 33 to line 15, column 36 in fp_infinite
    3. Line 12, column 9 to line 12, column 22 in fp_infinite
    4. Line 12, column 9 to line 12, column 18 in fp_infinite
---*)
