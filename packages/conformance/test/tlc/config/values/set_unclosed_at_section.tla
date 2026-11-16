(*---
description: "A set isn't ended by a keyword: INIT after an element fails the check for }."
ref: tlc2/tool/impl/ModelConfig.java#parseValue
outcome: config-error
config: |
  CONSTANT N = {1
  INIT Init
---*)
---- MODULE set_unclosed_at_section ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 2
    It was expecting }, but did not find it.
---*)
