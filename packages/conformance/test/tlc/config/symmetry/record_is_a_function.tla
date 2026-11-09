(*---
description: A record isn't a FcnRcdValue, so it fails the function records check.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
features:
  - tlc-bug
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  CONSTANT S = {a, b}
  SYMMETRY Sym
---*)
---- MODULE record_is_a_function ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == {[p |-> 1]}
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The symmetry values must be function records.
---*)
