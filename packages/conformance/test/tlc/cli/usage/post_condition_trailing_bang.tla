(*---
description: Java's split drops a trailing empty string, so 'Mod!' has one part and fails the form check rather than the check for an empty operator.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -postCondition
  - Mod!
---*)
---- MODULE post_condition_trailing_bang ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Module!Operator for postCondition must be of the form module!operator. Encountered: Mod!
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
