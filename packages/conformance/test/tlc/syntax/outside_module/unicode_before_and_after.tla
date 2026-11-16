(*---
description: Non-ASCII text outside the module is ignored.
ref: "tla2sany/parser/TLAplusParser.java#CompilationUnit"
features: [outside_module]
flags: [expression]
outcome: success
---*)
∧ é 😀
---- MODULE unicode_before_and_after ----
Test == TRUE
====
∧ é 😀

(*--- recorded
all:
  exit: 0
---*)
