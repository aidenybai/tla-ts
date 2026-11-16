(*---
description: "LET binds a zero-arity definition lazily, so an unused definition with an error never runs."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE unused_definition_error_skipped ----
EXTENDS Integers
Test == LET a == 1 \div 0 IN TRUE
====

(*--- recorded
all:
  exit: 0
---*)
