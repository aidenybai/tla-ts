(*---
description: "Seq(S) stops at the first element outside S."
ref: "tlc2/module/Sequences.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE seq_element_type_checked ----
EXTENDS Integers, Sequences
Test == <<-1, "a">> \notin Seq(Nat)
====

(*--- recorded
all:
  exit: 0
---*)
