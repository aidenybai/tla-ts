(*---
description: OMITTED after a false theorem is not checked.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE omitted_on_false ----
THEOREM FALSE OMITTED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
