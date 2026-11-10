(*---
description: "CHOOSE with a tuple binder stops at a witness before it reaches a malformed element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_stops_before_bad_element ----
EXTENDS Integers
Test == (CHOOSE <<a, b>> \in {<<1, 2>>, <<1, 2, 3>>} : TRUE) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
