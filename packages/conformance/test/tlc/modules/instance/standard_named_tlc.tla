(*---
description: "TLC may be instanced by name, with its printing operators working."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE standard_named_tlc ----
T == INSTANCE TLC
Test == T!Print(1, TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1  TRUE"
---*)
