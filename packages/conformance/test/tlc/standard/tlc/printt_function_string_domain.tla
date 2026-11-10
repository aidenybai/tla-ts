(*---
description: A function on strings is a record, and prints as one.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_function_string_domain ----
EXTENDS TLC, Naturals
Test == PrintT("a" :> 1 @@ "b" :> 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> 2]"
---*)
