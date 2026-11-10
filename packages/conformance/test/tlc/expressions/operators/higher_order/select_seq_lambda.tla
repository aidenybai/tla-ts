(*---
description: "SelectSeq takes a LAMBDA."
ref: "tlc2/module/Sequences.java#SelectSeq"
flags: [expression]
outcome: success
---*)
---- MODULE select_seq_lambda ----
EXTENDS Integers, Sequences
Test == SelectSeq(<<1, 2, 3>>, LAMBDA x : x > 1) = <<2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
