(*---
description: A PICK step binds a name for later steps.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_pick ----
THEOREM FALSE
<1>1. PICK x \in {1} : x = 1
<1>2. x = 1
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
