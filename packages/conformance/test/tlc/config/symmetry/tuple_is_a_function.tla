(*---
description: A tuple isn't a FcnRcdValue either, so it fails the same check.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  CONSTANT S = {a, b}
  SYMMETRY Sym
---*)
---- MODULE tuple_is_a_function ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == {<<1, 2>>}
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
