(*---
description: "S \\ Nat for a non-Reducible finite S enumerates and answers."
ref: "tlc2/value/impl/SetDiffValue.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE diff_is_finite_when_left_finite ----
EXTENDS Integers
Test == ((SUBSET {1}) \ {{}}) = {{1}}
====

(*--- recorded
all:
  exit: 0
---*)
