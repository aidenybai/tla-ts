(*---
description: A LET INSTANCE may substitute a bound name.
ref: "tla2sany/semantic/Generator.java#processLetIn"
features: [instance]
flags: [expression]
includes: [FixConst.tla]
outcome: success
---*)
---- MODULE let_instance_with ----
Test == \A x \in {1} : LET M == INSTANCE FixConst WITH c <- x IN M!d = x
====

(*--- recorded
all:
  exit: 0
---*)
