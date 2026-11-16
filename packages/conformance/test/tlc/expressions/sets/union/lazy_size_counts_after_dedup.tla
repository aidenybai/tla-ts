(*---
description: "Cardinality of a lazy UNION counts distinct elements."
ref: "tlc2/value/impl/UnionValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_size_counts_after_dedup ----
EXTENDS Integers, FiniteSets
Test == Cardinality(UNION {1..2, 2..3}) = 3
====

(*--- recorded
all:
  exit: 0
---*)
