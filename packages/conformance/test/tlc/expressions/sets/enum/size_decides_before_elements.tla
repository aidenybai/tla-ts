(*---
description: "Sets of different size differ without comparing their incomparable nested elements."
ref: "tlc2/value/impl/SetEnumValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE size_decides_before_elements ----
EXTENDS Integers
Test == {{1}, {"a", "b"}} # {{1}}
====

(*--- recorded
all:
  exit: 0
---*)
