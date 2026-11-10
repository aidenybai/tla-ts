(*---
description: A HAVE step is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_have ----
THEOREM FALSE
<1> HAVE TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
