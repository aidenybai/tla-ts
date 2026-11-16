(*---
description: A standard module may be instanced by name.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE standard_named_infix_prefix ----
M == INSTANCE Naturals
Test == 3 \in M!Nat /\ M!+(1, 2) = 3 /\ M!..(1, 2) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
