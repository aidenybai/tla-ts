(*---
description: "A set map over two bounds ranges over their product."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE multiple_bounds_product ----
EXTENDS Integers
Test == {<<x, y>> : x \in {1, 2}, y \in {3}} = {1, 2} \X {3}
====

(*--- recorded
all:
  exit: 0
---*)
