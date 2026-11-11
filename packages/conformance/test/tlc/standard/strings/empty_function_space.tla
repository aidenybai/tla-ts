(*---
description: "[STRING -> {}] is empty because STRING answers isEmpty."
ref: tlc2/module/Strings.java#isEmpty
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE empty_function_space ----
EXTENDS TLC
Test == [STRING -> {}] = {} /\ STRING \X {} = {}
====

(*--- recorded
all:
  exit: 0
---*)
