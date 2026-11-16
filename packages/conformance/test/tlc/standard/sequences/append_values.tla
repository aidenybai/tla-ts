(*---
description: Append adds at the end, keeping nested sequences nested.
ref: tlc2/module/Sequences.java#Append
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE append_values ----
EXTENDS Sequences, Naturals
Test == Append(<<>>, 1) = <<1>> /\ Append(<<1>>, <<2>>) = <<1, <<2>>>>
====

(*--- recorded
all:
  exit: 0
---*)
