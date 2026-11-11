(*---
description: Any prints under its Java name.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE any_print ----
EXTENDS TLC, Naturals
Test == PrintT(Any)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ANY"
---*)
