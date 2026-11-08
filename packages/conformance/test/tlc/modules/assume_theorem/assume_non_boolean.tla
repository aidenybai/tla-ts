(*---
description: A non-Boolean ASSUME is an evaluation error.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: evaluation-failure
---*)
---- MODULE assume_non_boolean ----
ASSUME 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption 1 failed.
    2215:0 TLC expected a boolean value, but did not find one. 1
---*)
