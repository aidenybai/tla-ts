(*---
description: "RECURSIVE works inside LET."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE recursive_operator_in_let ----
EXTENDS Integers
Test == LET RECURSIVE sum(_)
            sum(n) == IF n = 0 THEN 0 ELSE n + sum(n - 1)
        IN sum(4) = 10
====

(*--- recorded
all:
  exit: 0
---*)
