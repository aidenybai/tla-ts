(*---
description: "S \\ T membership checks T only when S holds the element."
ref: "tlc2/value/impl/SetDiffValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE diff_lazy_short_circuits ----
EXTENDS Integers
Test == -1 \notin (Nat \ {"a"})
====

(*--- recorded
all:
  exit: 0
---*)
