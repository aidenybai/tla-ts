(*---
description: An ASSUME that cannot be evaluated is an evaluation error.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: evaluation-failure
---*)
---- MODULE assume_eval_error ----
ASSUME 1 \in 2
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 8, col 8 to line 8, col 14 of module assume_eval_error failed.
    Attempted to check if the value:
    1
    is an element of the integer 2
---*)
