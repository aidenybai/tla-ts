(*---
description: A finite set of strings is included in STRING.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE subseteq ----
EXTENDS TLC
Test == {"a", "b"} \subseteq STRING
====

(*--- recorded
all:
  exit: 0
---*)
