(*---
description: A step may be an ASSUME/PROVE.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_assume_prove ----
THEOREM FALSE
<1>1. ASSUME TRUE PROVE TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
