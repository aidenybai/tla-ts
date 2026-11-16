(*---
description: An argument list that stops at a token other than ')' or ',' reports the general error.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT F(1, 2 3) = 4
---*)
---- MODULE value_after_comma_missing_paren ----
CONSTANT F(_, _)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 5002:1 TLC found an error in the configuration file at line 1
---*)
