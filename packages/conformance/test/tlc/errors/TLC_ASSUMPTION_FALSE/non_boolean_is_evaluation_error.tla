(*---
description: A non-Boolean ASSUME isn't false. It is an evaluation error.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: evaluation-failure
config: ""
---*)
---- MODULE non_boolean_is_evaluation_error ----
ASSUME 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. 1
    2215:0 TLC expected a boolean value, but did not find one. 1
---*)
