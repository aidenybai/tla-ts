(*---
description: A block comment that never closes reaches the end of the file with the sections inside it unread.
ref: tlc2/tool/impl/ModelConfig.java#getNextToken
outcome: config-error
config: |
  INIT Init
  NEXT Next
  (* never closed
---*)
---- MODULE unterminated_block_comment ----
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
    Lexical error at line 5, column 0.  Encountered: <EOF> after : ""
---*)
