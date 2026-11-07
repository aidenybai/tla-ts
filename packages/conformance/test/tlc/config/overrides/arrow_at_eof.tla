(*---
description: "'<-' at the end of the file reports that a name was expected."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT N <-
---*)
---- MODULE arrow_at_eof ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5005:1 TLC found an error in the configuration file at line 2
    Expected an identifier after <-.
---*)
