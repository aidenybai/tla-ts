(*---
description: "SubSeq works on strings."
ref: "tlc2/module/Sequences.java#SubSeq"
flags: [expression]
outcome: success
---*)
---- MODULE subseq ----
EXTENDS Integers, Sequences
Test == SubSeq("abc", 2, 3) = "bc" /\ SubSeq("abc", 1, 1) = "a"
====

(*--- recorded
all:
  exit: 0
---*)
