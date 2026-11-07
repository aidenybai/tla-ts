(*---
description: "An escape sequence is one character."
ref: "tlc2/module/Sequences.java#Len"
flags: [expression]
outcome: success
---*)
---- MODULE len_counts_escape_as_one ----
EXTENDS Integers, Sequences
Test == Len("a\nb") = 3 /\ Len("\\") = 1 /\ Len("\"") = 1
====

(*--- recorded
all:
  exit: 0
---*)
