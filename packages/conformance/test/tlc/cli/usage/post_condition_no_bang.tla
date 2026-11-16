(*---
description: -postCondition needs a Module!Operator form.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -postCondition
  - Foo
---*)
---- MODULE post_condition_no_bang ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Module!Operator for postCondition required. Encountered: Foo
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
