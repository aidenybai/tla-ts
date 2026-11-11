(*---
description: "A user prefix definition overrides nothing when Integers is absent."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE prefix_user_definition ----
EXTENDS TLC
-. a == 7
Test == -1 = 7
====

(*--- recorded
all:
  exit: 0
---*)
