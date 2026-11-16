(*---
description: ToString(STRING) is the string STRING.
ref: tlc2/module/Strings.java#toString
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE to_string ----
EXTENDS TLC
Test == ToString(STRING) = "STRING"
====

(*--- recorded
all:
  exit: 0
---*)
