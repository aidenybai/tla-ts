(*---
description: _TETrace chooses from functions over Nat \ {0}, a set TLC cannot enumerate.
ref: tla2sany/StandardModules/Toolbox.tla#_TETrace
features:
  - Toolbox
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE tetrace_not_enumerable ----
EXTENDS Toolbox
Test == _TETrace = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module tetrace_not_enumerable failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in tetrace_not_enumerable
    1. Line 14, column 29 to line 14, column 32 in tetrace_not_enumerable
    2. Line 12, column 9 to line 12, column 20 in tetrace_not_enumerable
    3. Line 12, column 9 to line 12, column 16 in tetrace_not_enumerable
    4. Line 14, column 5 to line 14, column 49 in Toolbox
    5. Line 14, column 18 to line 14, column 42 in Toolbox
    6. Line 14, column 21 to line 14, column 29 in Toolbox


    Reason:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in tetrace_not_enumerable
    1. Line 15, column 30 to line 15, column 33 in tetrace_not_enumerable
    2. Line 12, column 9 to line 12, column 20 in tetrace_not_enumerable
    3. Line 12, column 9 to line 12, column 16 in tetrace_not_enumerable
    4. Line 14, column 5 to line 14, column 49 in Toolbox
    5. Line 14, column 18 to line 14, column 42 in Toolbox
    6. Line 14, column 21 to line 14, column 29 in Toolbox


    Reason:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in tetrace_not_enumerable
    1. Line 16, column 8 to line 16, column 32 in tetrace_not_enumerable
    2. Line 16, column 29 to line 16, column 32 in tetrace_not_enumerable
    3. Line 12, column 9 to line 12, column 20 in tetrace_not_enumerable
    4. Line 12, column 9 to line 12, column 16 in tetrace_not_enumerable
    5. Line 14, column 5 to line 14, column 49 in Toolbox
    6. Line 14, column 18 to line 14, column 42 in Toolbox
    7. Line 14, column 21 to line 14, column 29 in Toolbox


    Reason:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    While working on the initial state:
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in tetrace_not_enumerable
    1. Line 15, column 12 to line 15, column 36 in tetrace_not_enumerable
    2. Line 15, column 33 to line 15, column 36 in tetrace_not_enumerable
    3. Line 12, column 9 to line 12, column 20 in tetrace_not_enumerable
    4. Line 12, column 9 to line 12, column 16 in tetrace_not_enumerable
    5. Line 14, column 5 to line 14, column 49 in Toolbox
    6. Line 14, column 18 to line 14, column 42 in Toolbox
    7. Line 14, column 21 to line 14, column 29 in Toolbox


    Reason:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
