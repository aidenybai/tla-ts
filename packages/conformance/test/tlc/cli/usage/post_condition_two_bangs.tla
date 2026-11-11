(*---
description: -postCondition takes exactly one '!'.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -postCondition
  - A!B!C
---*)
---- MODULE post_condition_two_bangs ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Module!Operator for postCondition must be of the form module!operator. Encountered: A!B!C
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
