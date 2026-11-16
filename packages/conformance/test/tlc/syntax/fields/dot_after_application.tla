(*---
description: Dot may follow a function application.
ref: tla2sany/parser/Operators.java
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE dot_after_application ----
Test == <<[a |-> 7]>>[1].a = 7
====

(*--- recorded
all:
  exit: 0
---*)
