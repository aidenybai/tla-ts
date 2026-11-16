(*---
description: "SelectSeq of an empty sequence does not run the test."
ref: "tlc2/module/Sequences.java#SelectSeq"
flags: [expression]
outcome: success
---*)
---- MODULE select_seq_empty_skips_test ----
EXTENDS Integers, Sequences
Test == SelectSeq(<<>>, LAMBDA x : 1 \div 0 = 0) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
