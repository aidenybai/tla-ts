(*---
description: "<+> begins a new deeper proof."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_plus_level ----
THEOREM FALSE
<+> TRUE
  <+> TRUE
  <*> QED
<*> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
