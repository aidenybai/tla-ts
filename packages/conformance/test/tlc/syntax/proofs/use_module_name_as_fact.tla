(*---
description: USE MODULE names a module.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE use_module_name_as_fact ----
---- MODULE I ----
A == 1
====
USE MODULE I
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
