(*---
description: "Step levels may have leading zeros, which are removed."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_level_leading_zeros ----
THEOREM FALSE
<01>1. TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
