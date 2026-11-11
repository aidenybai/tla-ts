(*---
description: "A named instance brings only M!A, so a plain A beside it is a separate definition."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE definition_beside_named_instance ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
A == 2
Test == A = 2 /\ M!A = 1
====

(*--- recorded
all:
  exit: 0
---*)
