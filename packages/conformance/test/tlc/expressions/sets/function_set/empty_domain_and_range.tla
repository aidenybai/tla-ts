(*---
description: "[{} -> {}] holds the empty function."
ref: "tlc2/value/impl/SetOfFcnsValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE empty_domain_and_range ----
EXTENDS Integers
Test == [{} -> {}] = {<<>>}
====

(*--- recorded
all:
  exit: 0
---*)
