(*---
description: A label around a whole EXCEPT is fine.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_on_except_as_a_whole ----
Op == l:: [<<1>> EXCEPT ![1] = 2]
Test == Op!l = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
