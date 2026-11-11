(*---
description: A declared constant with neither a value nor an override stops TLC.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: ""
---*)
---- MODULE unassigned_constant ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter N is not assigned a value by the configuration file.
---*)
