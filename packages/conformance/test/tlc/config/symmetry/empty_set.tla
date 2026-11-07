(*---
description: "An empty set of permutations makes TLC crash with an uncaught IllegalArgumentException instead of a message about the definition."
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
---- MODULE empty_set ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == {}
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.IllegalArgumentException
    java.lang.IllegalArgumentException
---*)
