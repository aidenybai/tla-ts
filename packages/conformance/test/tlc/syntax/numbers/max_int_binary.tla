(*---
description: "The largest int literal TLC holds, in binary."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE max_int_binary ----
Test == \b1111111111111111111111111111111 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
