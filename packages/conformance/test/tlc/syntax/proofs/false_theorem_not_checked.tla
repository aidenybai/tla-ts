(*---
description: "TLC never evaluates a THEOREM, so a false one has no effect."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE false_theorem_not_checked ----
THEOREM FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
