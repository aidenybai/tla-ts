(*---
description: A stepped proof with QED is parsed and ignored.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE steps_with_qed ----
THEOREM FALSE
<1>1. TRUE
<1>2. FALSE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
