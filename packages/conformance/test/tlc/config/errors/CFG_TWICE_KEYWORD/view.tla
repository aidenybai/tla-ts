(*---
description: VIEW may appear only once, and the error gives the keyword and the line of the second use.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  VIEW Init

  VIEW Init
---*)
---- MODULE view ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5004:1 TLC found an error in the configuration file at line 3
    The keyword VIEW appeared twice.
---*)
