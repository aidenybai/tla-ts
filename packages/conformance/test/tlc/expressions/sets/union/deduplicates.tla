(*---
description: "UNION of enumerated sets drops duplicates across them."
ref: "tlc2/value/impl/UnionValue.java#union"
flags: [expression]
outcome: success
---*)
---- MODULE deduplicates ----
EXTENDS Integers
Test == UNION {{1}, {1, 2}} = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
