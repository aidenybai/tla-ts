(*---
description: "A LET definition guarded by a false condition in the body never runs."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE guarded_definition_not_reached ----
EXTENDS Integers
Test == LET a == 1 \div 0 IN FALSE => a = 1
====

(*--- recorded
all:
  exit: 0
---*)
