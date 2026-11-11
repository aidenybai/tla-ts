(*---
description: A postfix operator may be declared RECURSIVE.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_declaration ----
EXTENDS Naturals
RECURSIVE _ ^+
a ^+ == IF a = 0 THEN 0 ELSE (a - 1)^+
Test == 3^+ = 0
====

(*--- recorded
all:
  exit: 0
---*)
