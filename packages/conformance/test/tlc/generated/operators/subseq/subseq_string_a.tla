(*---
description: subseq applied to string_a, a StringValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq("a", 1, 1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a"'
---*)
