(*---
description: "An unused LET definition may have any type, including one that would fail when used."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE unused_definition_non_boolean_skipped ----
EXTENDS Integers
Test == LET a == 1 + "s" IN TRUE
====

(*--- recorded
all:
  exit: 0
---*)
