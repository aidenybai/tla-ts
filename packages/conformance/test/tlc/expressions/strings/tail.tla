(*---
description: "Tail of a string drops its first character."
ref: "tlc2/module/Sequences.java#Tail"
flags: [expression]
outcome: success
---*)
---- MODULE tail ----
EXTENDS Integers, Sequences
Test == Tail("abc") = "bc" /\ Tail("a") = ""
====

(*--- recorded
all:
  exit: 0
---*)
