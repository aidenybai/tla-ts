(*---
description: m > n on a string is the empty string, not the empty tuple.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_string_empty_range ----
EXTENDS Sequences, Naturals
Test == SubSeq("abc", 3, 2) = ""
====

(*--- recorded
all:
  exit: 0
---*)
