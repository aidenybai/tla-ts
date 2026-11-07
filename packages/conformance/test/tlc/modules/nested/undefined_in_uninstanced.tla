(*---
description: A semantic error in an unused nested module is still reported.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
outcome: parse-error
---*)
---- MODULE undefined_in_uninstanced ----
---- MODULE I ----
A == DoesNotExist
====
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 17 of module undefined_in_uninstanced
    | Unknown operator: `DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
