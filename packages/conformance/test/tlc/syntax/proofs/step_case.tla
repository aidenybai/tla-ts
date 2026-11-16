(*---
description: A CASE step is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_case ----
THEOREM FALSE
<1>1. CASE TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
