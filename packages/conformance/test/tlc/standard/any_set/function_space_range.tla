(*---
description: A function into Any is in [D -> Any] whatever its values.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE function_space_range ----
EXTENDS TLC
Test == <<5, "a">> \in [{1, 2} -> Any]
====

(*--- recorded
all:
  exit: 0
---*)
