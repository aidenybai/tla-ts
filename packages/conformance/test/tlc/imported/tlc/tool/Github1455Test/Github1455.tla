(*---
description: Ported from TLC's Github1455Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1455Test.java
features:
  - tlc-regression
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK FALSE
  "unterminated
  INVARIANT Never
args:
  - -deadlock
---*)
---- MODULE Github1455 ----
VARIABLE x
Init == x = 0
Next == UNCHANGED x
Never == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5007:1 TLC found an error in the configuration file:
    Lexical error at line 4, column 14.  Encountered: "\n" (10), after : "\"unterminated"
---*)
