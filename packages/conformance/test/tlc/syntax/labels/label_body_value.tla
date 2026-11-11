(*---
description: "A label is transparent: the labeled definition has the body's value."
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_body_value ----
EXTENDS Naturals
Op == l:: 1 + 1
Test == Op = 2
====

(*--- recorded
all:
  exit: 0
---*)
