(*---
description: An ASSUME/PROVE may be nested as an assumption.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE nested_assume_prove ----
THEOREM ASSUME ASSUME TRUE PROVE FALSE PROVE FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
