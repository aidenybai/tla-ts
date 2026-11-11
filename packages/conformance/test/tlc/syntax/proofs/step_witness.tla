(*---
description: A WITNESS step is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_witness ----
THEOREM FALSE
<1> WITNESS 1 \in {1}
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
