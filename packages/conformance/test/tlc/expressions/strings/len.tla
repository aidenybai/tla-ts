(*---
description: "Len counts characters in a string."
ref: "tlc2/module/Sequences.java#Len"
flags: [expression]
outcome: success
---*)
---- MODULE len ----
EXTENDS Integers, Sequences
Test == Len("abc") = 3 /\ Len("") = 0
====

(*--- recorded
all:
  exit: 0
---*)
