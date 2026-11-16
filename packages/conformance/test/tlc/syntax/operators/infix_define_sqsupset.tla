(*---
description: "\\sqsupset has no meaning without a standard module, so a module may define it, and its infix use applies that definition."
ref: "tla2sany/parser/Operators.java#CanonicalOperators"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE infix_define_sqsupset ----
a \sqsupset b == <<a, b>>
Test == (1 \sqsupset 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
