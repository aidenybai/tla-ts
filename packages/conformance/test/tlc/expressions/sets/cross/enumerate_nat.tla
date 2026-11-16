(*---
description: "Enumerating a product with Nat is an error that names the component index."
ref: "tlc2/value/impl/SetOfTuplesValue.java#Enumerator"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE enumerate_nat ----
EXTENDS Integers
Test == {t \in {1} \X Nat : TRUE} = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module enumerate_nat failed.
    Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat
    1. Line 11, column 29 to line 11, column 32 in enumerate_nat
    2. Line 9, column 9 to line 9, column 38 in enumerate_nat
    3. Line 9, column 16 to line 9, column 25 in enumerate_nat


    Reason:
    Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in enumerate_nat
    1. Line 12, column 30 to line 12, column 33 in enumerate_nat
    2. Line 9, column 9 to line 9, column 38 in enumerate_nat
    3. Line 9, column 16 to line 9, column 25 in enumerate_nat


    Reason:
    Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat
    1. Line 13, column 8 to line 13, column 32 in enumerate_nat
    2. Line 13, column 29 to line 13, column 32 in enumerate_nat
    3. Line 9, column 9 to line 9, column 38 in enumerate_nat
    4. Line 9, column 16 to line 9, column 25 in enumerate_nat


    Reason:
    Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat
    1. Line 12, column 12 to line 12, column 36 in enumerate_nat
    2. Line 12, column 33 to line 12, column 36 in enumerate_nat
    3. Line 9, column 9 to line 9, column 38 in enumerate_nat
    4. Line 9, column 16 to line 9, column 25 in enumerate_nat


    Reason:
    Attempted to enumerate a set of the form s1 \X s2 ... \X sn,
    but can't enumerate s1:
    Nat
---*)
