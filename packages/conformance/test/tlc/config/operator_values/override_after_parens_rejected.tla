(*---
description: "'<-' is only recognized right after the name, so it isn't accepted after an argument list."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT F(1) <- G
---*)
---- MODULE override_after_parens_rejected ----
CONSTANT F(_)
G(a) == a
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting = or <-, but did not find it.
---*)
