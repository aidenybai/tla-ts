(*---
description: "The largest int literal TLC holds, in octal."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE max_int_octal ----
Test == \o17777777777 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
