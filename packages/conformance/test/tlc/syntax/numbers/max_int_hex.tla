(*---
description: "The largest int literal TLC holds, in hex."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE max_int_hex ----
Test == \h7FFFFFFF = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
