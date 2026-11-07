(*---
description: "Application to a function over STRING stays lazy."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE apply_string_function ----
EXTENDS Integers, Sequences
Test == [s \in STRING |-> s \o "!"]["a"] = "a!"
====

(*--- recorded
all:
  exit: 0
---*)
