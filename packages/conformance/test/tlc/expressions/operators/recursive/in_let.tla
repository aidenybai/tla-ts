(*---
description: "RECURSIVE works in LET, and the definition sees enclosing binders."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE in_let ----
EXTENDS Integers
Test == \A k \in 1..2 : LET RECURSIVE R(_)
                          R(n) == IF n = 0 THEN k ELSE R(n - 1) + 1
                      IN R(2) = k + 2
====

(*--- recorded
all:
  exit: 0
---*)
