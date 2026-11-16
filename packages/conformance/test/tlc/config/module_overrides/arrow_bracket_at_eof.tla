(*---
description: "'<- [' at the end of the file reports a missing name with the '<-[' context."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT K <- [
---*)
---- MODULE arrow_bracket_at_eof ----
K == 1
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5005:1 TLC found an error in the configuration file at line 2
    Expected an identifier after <-[.
---*)
