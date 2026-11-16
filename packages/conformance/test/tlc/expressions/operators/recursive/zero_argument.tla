(*---
description: "A zero-argument definition can be declared RECURSIVE and not actually recurse at runtime."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE zero_argument ----
EXTENDS Integers
RECURSIVE A
A == IF TRUE THEN 1 ELSE A
Test == A = 1
====

(*--- recorded
all:
  exit: 0
---*)
