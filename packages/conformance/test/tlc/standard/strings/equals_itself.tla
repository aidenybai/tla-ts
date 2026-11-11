(*---
description: STRING equals STRING.
ref: tlc2/module/Strings.java#compareTo
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE equals_itself ----
EXTENDS TLC
Test == STRING = STRING
====

(*--- recorded
all:
  exit: 0
---*)
