(*---
description: A missing closing parenthesis reports the general configuration error for that line.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT F(1 = 2
---*)
---- MODULE unclosed_parens_rejected ----
CONSTANT F(_)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 5002:1 TLC found an error in the configuration file at line 1
---*)
