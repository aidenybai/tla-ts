(*---
description: A step may have a level and no name.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_bare_level ----
THEOREM FALSE
<1> TRUE
<1>. TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
