(*---
description: "\\A x, y \\in S binds each variable to every element independently."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE shared_domain_binds_independently ----
EXTENDS Integers, FiniteSets
Test == Cardinality({<<x, y>> : x, y \in 1..3}) = 9
====

(*--- recorded
all:
  exit: 0
---*)
