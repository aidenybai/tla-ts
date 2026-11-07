(*---
description: "\\HFf is the upper case spelling of hex."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE hex_upper ----
Test == \HFf = 255
====

(*--- recorded
all:
  exit: 0
---*)
