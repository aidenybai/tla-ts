(*---
description: A character that can't be lexed is a lexical error rather than an early end of the file.
ref: tlc2/tool/impl/ModelConfig.java#getNextToken
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT `
---*)
---- MODULE lexical_error_stops_the_file ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5007:1 TLC found an error in the configuration file:
    Lexical error at line 3, column 11.  Encountered: "`" (96), after : ""
---*)
