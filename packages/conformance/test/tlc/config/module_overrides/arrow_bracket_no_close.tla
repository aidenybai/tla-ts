(*---
description: A token other than ] after the module name reports the missing ].
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT K <- [inner Alt
---*)
---- MODULE arrow_bracket_no_close ----
K == 1
Alt == 2
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting ], but did not find it.
---*)
