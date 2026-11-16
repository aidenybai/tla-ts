(*---
description: "A recursive function can use a tuple binder."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rfs"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder ----
EXTENDS Integers
F[<<a, b>> \in (0..2) \X (0..2)] == IF a = 0 THEN b ELSE F[<<a - 1, b + 0>>] + 1
Test == F[<<2, 1>>] = 3
====

(*--- recorded
all:
  exit: 0
---*)
