(*---
description: SUFFICES may hold an ASSUME/PROVE.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_suffices_assume_prove ----
THEOREM FALSE
<1> SUFFICES ASSUME TRUE PROVE FALSE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
