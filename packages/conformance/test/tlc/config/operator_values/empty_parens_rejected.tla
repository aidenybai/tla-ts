(*---
description: "'F()' feeds ')' to parseValue as a model value, and then '=' isn't the closing parenthesis."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT F() = 2
---*)
---- MODULE empty_parens_rejected ----
CONSTANT F(_)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 5002:1 TLC found an error in the configuration file at line 1
---*)
