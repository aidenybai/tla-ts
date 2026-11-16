(*---
description: A function into STRING over a finite domain is accepted.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE function_set_membership ----
EXTENDS TLC
Test == ("k" :> "v") \in [{"k"} -> STRING]
====

(*--- recorded
all:
  exit: 0
---*)
