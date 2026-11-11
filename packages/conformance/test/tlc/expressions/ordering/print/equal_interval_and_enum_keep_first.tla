(*---
description: "Normalization keeps the first of two equal elements, so the source order decides the printed form."
ref: "tlc2/value/impl/ValueVec.java#sort"
flags: [expression]
outcome: success
---*)
---- MODULE equal_interval_and_enum_keep_first ----
EXTENDS Integers, TLC
Test == PrintT({1..2, {1, 2}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1..2}"
---*)
