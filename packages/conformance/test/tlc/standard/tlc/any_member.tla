(*---
description: Every kind of value is a member of TLC's Any.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE any_member ----
EXTENDS TLC, Naturals
Test == 1 \in Any /\ "a" \in Any /\ {} \in Any /\ <<1>> \in Any /\ [a |-> 1] \in Any /\ TRUE \in Any
====

(*--- recorded
all:
  exit: 0
---*)
