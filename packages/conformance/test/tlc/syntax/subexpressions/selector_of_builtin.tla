(*---
description: A built-in constant has no subexpression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_builtin ----
Test == TRUE!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 12 of module selector_of_builtin
    | Cannot take subexpression of `TRUE'.
    3002:1 Parsing or semantic analysis failed.
---*)
