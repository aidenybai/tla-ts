(*---
description: A SUFFICES step is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_suffices ----
THEOREM FALSE
<1> SUFFICES TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
