(*---
description: An operator constant with no table or override fails like a plain constant.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: ""
---*)
---- MODULE operator_constant ----
CONSTANT F(_, _)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter F is not assigned a value by the configuration file.
---*)
