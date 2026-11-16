(*---
description: "[{} -> T] holds one function while [S -> {}] holds none."
ref: "tlc2/value/impl/SetOfFcnsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_domain_differs_from_empty_range ----
EXTENDS Integers
Test == [{} -> {1}] # [{1} -> {}]
====

(*--- recorded
all:
  exit: 0
---*)
