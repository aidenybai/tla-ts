(*---
description: An infix operator may be declared RECURSIVE in a LET.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE let_infix_declaration ----
EXTENDS Naturals
Test ==
  LET RECURSIVE _ ++ _
      a ++ b == IF a = 0 THEN b ELSE (a - 1) ++ (b + 1)
  IN (2 ++ 3) = 5
====

(*--- recorded
all:
  exit: 0
---*)
