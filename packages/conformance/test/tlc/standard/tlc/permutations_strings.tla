(*---
description: Permutations of strings are functions on strings.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_strings ----
EXTENDS TLC, Naturals
Test == ("a" :> "b" @@ "b" :> "a") \in Permutations({"a", "b"})
====

(*--- recorded
all:
  exit: 0
---*)
