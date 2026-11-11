(*---
description: "SubSeq returns the empty string when m exceeds n, with no bounds check."
ref: "tlc2/module/Sequences.java#SubSeq"
flags: [expression]
outcome: success
---*)
---- MODULE subseq_empty_when_reversed ----
EXTENDS Integers, Sequences
Test == SubSeq("abc", 3, 2) = "" /\ SubSeq("abc", 9, 1) = ""
====

(*--- recorded
all:
  exit: 0
---*)
