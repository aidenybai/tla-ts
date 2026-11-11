(*---
description: An INSTANCE step of a standard module is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_instance ----
THEOREM FALSE
<1> INSTANCE Naturals
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
