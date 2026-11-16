(*---
description: "Sequences may be instanced by name, with Java overrides still applied."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE standard_named_sequences ----
S == INSTANCE Sequences
Test == S!Len(<<1, 2>>) = 2 /\ S!Head(<<1>>) = 1
====

(*--- recorded
all:
  exit: 0
---*)
