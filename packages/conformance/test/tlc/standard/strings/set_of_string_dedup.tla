(*---
description: "{STRING, STRING} normalizes to a single element."
ref: tlc2/module/Strings.java#compareTo
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE set_of_string_dedup ----
EXTENDS TLC
Test == {STRING, STRING} = {STRING}
====

(*--- recorded
all:
  exit: 0
---*)
