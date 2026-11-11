(*---
description: Hex digits may be all letters.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE hex_digits_only_letters ----
Test == \habc = 2748
====

(*--- recorded
all:
  exit: 0
---*)
