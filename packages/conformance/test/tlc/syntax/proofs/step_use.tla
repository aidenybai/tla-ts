(*---
description: A USE step is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_use ----
A == 1
THEOREM FALSE
<1> USE DEF A
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
