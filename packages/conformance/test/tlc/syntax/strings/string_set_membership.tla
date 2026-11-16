(*---
description: STRING contains the empty string and strings with escapes.
ref: tlc2/value/impl/StringValue.java
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE string_set_membership ----
Test == "" \in STRING /\ "\n" \in STRING
====

(*--- recorded
all:
  exit: 0
---*)
