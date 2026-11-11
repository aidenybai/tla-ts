(*---
description: OBVIOUS after a false theorem is not checked.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE obvious_on_false ----
THEOREM FALSE OBVIOUS
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
