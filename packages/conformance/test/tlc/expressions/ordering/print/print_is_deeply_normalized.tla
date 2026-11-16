(*---
description: "PrintT normalizes nested sets."
ref: "tlc2/module/TLC.java#Print"
flags: [expression]
outcome: success
---*)
---- MODULE print_is_deeply_normalized ----
EXTENDS Integers, TLC
Test == PrintT(<<{2, 1}, [zk |-> {4, 3}]>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{1, 2}, [zk |-> {3, 4}]>>"
---*)
