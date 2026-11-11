(*---
description: A selector on an undefined name reports the name.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_undefined ----
Test == DoesNotExist!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 20 of module selector_of_undefined
    | Unknown operator: `DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
