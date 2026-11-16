(*---
description: "<*> is a step of the current level."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_star_level ----
THEOREM FALSE
<*> TRUE
<*> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
