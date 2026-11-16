(*---
description: A TAKE step is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_take ----
THEOREM FALSE
<1> TAKE x \in {1}
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
