(*---
description: A string with no closing quote is a lexical error.
ref: tlc2/tool/impl/ModelConfig.java#getNextToken
outcome: config-error
config: |
  CONSTANT N = "abc
---*)
---- MODULE unterminated_string_lexical_error ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5007:1 TLC found an error in the configuration file:
    Lexical error at line 1, column 18.  Encountered: "\n" (10), after : "\"abc"
---*)
