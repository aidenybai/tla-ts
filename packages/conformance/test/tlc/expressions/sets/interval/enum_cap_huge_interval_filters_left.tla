(*---
description: "S \\cap T filters the left set, so a small left set meets a huge interval without enumerating it."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cap"
flags: [expression]
outcome: success
---*)
---- MODULE enum_cap_huge_interval_filters_left ----
EXTENDS Integers
Test == ({1, 0} \cap (1..2147483647)) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
