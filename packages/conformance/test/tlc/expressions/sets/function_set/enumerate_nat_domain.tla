(*---
description: "Enumerating a function set over a non-enumerable domain is an error."
ref: "tlc2/value/impl/SetOfFcnsValue.java#Enumerator"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE enumerate_nat_domain ----
EXTENDS Integers
Test == {f \in [Nat -> {0}] : TRUE} = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module enumerate_nat_domain failed.
    Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat_domain
    1. Line 11, column 29 to line 11, column 32 in enumerate_nat_domain
    2. Line 9, column 9 to line 9, column 40 in enumerate_nat_domain
    3. Line 9, column 16 to line 9, column 27 in enumerate_nat_domain


    Reason:
    Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in enumerate_nat_domain
    1. Line 12, column 30 to line 12, column 33 in enumerate_nat_domain
    2. Line 9, column 9 to line 9, column 40 in enumerate_nat_domain
    3. Line 9, column 16 to line 9, column 27 in enumerate_nat_domain


    Reason:
    Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat_domain
    1. Line 13, column 8 to line 13, column 32 in enumerate_nat_domain
    2. Line 13, column 29 to line 13, column 32 in enumerate_nat_domain
    3. Line 9, column 9 to line 9, column 40 in enumerate_nat_domain
    4. Line 9, column 16 to line 9, column 27 in enumerate_nat_domain


    Reason:
    Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in enumerate_nat_domain
    1. Line 12, column 12 to line 12, column 36 in enumerate_nat_domain
    2. Line 12, column 33 to line 12, column 36 in enumerate_nat_domain
    3. Line 9, column 9 to line 9, column 40 in enumerate_nat_domain
    4. Line 9, column 16 to line 9, column 27 in enumerate_nat_domain


    Reason:
    Attempted to enumerate a set of the form [D -> R],but the domain D:
    Nat
    cannot be enumerated.
---*)
