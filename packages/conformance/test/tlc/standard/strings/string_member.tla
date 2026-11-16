(*---
description: Any string, even empty or with escapes, is in STRING.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE string_member ----
EXTENDS TLC
Test == "a" \in STRING /\ "" \in STRING /\ "a\"b\n" \in STRING
====

(*--- recorded
all:
  exit: 0
---*)
