(*---
description: DOMAIN of a function over Any is Any.
ref: tlc2/module/TLC.java#Any
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE function_over_any_domain ----
EXTENDS TLC
Test == PrintT(DOMAIN [x \in Any |-> 1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| ANY"
---*)
