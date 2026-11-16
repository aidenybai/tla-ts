(*---
description: SubSeq of a string is a string, the branch added in 2013.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_string ----
EXTENDS Sequences, Naturals
Test == SubSeq("abcd", 2, 3) = "bc" /\ SubSeq("abc", 1, 3) = "abc"
====

(*--- recorded
all:
  exit: 0
---*)
