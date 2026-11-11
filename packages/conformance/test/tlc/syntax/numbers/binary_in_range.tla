(*---
description: A based literal is a normal integer operand of ..
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE binary_in_range ----
EXTENDS Naturals
Test == \b10..\h3 = {2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
