(*---
description: A CONSTANT without a value in the config is a config error before Init runs.
ref: tlc2/tool/impl/SpecProcessor.java#processConstants
outcome: config-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_undefined_constant ----
CONSTANT C
VARIABLE x
Next == UNCHANGED x
Init == x = C
====

(*--- recorded
all:
  exit: 151
  transcript: 2222:1 The constant parameter C is not assigned a value by the configuration file.
---*)
