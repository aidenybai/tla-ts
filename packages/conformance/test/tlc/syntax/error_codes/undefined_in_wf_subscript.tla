(*---
description: 4200 fires in a fairness subscript.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_in_wf_subscript ----
A == WF_Missing(TRUE)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 15 of module undefined_in_wf_subscript
    | Unknown operator: `Missing'.
    3002:1 Parsing or semantic analysis failed.
---*)
