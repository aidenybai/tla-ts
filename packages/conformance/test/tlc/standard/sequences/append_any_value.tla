(*---
description: Append accepts an element of any type.
ref: tlc2/module/Sequences.java#Append
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE append_any_value ----
EXTENDS Sequences, Naturals
Test == Append(<<1>>, "a") = <<1, "a">>
====

(*--- recorded
all:
  exit: 0
---*)
