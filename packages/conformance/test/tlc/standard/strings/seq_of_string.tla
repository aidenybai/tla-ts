(*---
description: A tuple of strings is in Seq(STRING).
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE seq_of_string ----
EXTENDS TLC, Sequences
Test == <<"a", "b">> \in Seq(STRING) /\ <<>> \in Seq(STRING)
====

(*--- recorded
all:
  exit: 0
---*)
