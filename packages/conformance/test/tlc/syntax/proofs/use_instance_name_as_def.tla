(*---
description: USE DEF may name an instance.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE use_instance_name_as_def ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
USE DEF M
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
