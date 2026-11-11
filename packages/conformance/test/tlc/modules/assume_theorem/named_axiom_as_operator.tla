(*---
description: "A named false AXIOM may still be evaluated by name, and has the value FALSE."
ref: "tlc2/tool/ITool.java#getAssumptionIsAxiom"
features: [assume_theorem]
flags: [expression]
outcome: success
---*)
---- MODULE named_axiom_as_operator ----
AXIOM A == FALSE
Test == ~A
====

(*--- recorded
all:
  exit: 0
---*)
