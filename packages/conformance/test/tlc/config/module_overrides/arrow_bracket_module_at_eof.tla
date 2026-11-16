(*---
description: "'<- [mod' at the end of the file reports the missing ]."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT K <- [inner
---*)
---- MODULE arrow_bracket_module_at_eof ----
K == 1
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 2
    It was expecting ], but did not find it.
---*)
