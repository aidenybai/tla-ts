(*---
description: "A recursive function is always lazy, so a failing branch for another argument never runs."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rfs"
flags: [expression]
outcome: success
---*)
---- MODULE unused_branch_stays_unevaluated ----
EXTENDS Integers
F[n \in 0..2] == IF n = 2 THEN 1 \div 0 ELSE IF n = 0 THEN 0 ELSE F[n - 1]
Test == F[1] = 0
====

(*--- recorded
all:
  exit: 0
---*)
