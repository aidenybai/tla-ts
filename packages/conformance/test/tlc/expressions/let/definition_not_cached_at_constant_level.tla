(*---
description: "Outside the next-state relation s1 is null, so TLC re-evaluates a LET definition at every use."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE definition_not_cached_at_constant_level ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == LET a == P(1, 1) IN a + a = 2
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
