(*---
description: An infix operator may be declared RECURSIVE.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE infix_declaration ----
EXTENDS Naturals
RECURSIVE _ ++ _
a ++ b == IF a = 0 THEN b ELSE (a - 1) ++ (b + 1)
Test == (2 ++ 3) = 5
====

(*--- recorded
all:
  exit: 0
---*)
