(*---
description: A label with no parameters takes no arguments.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
outcome: parse-error
---*)
---- MODULE argument_to_argless_label ----
Op == l:: TRUE
Test == Op!l(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module argument_to_argless_label
    | Label `l' used with wrong number of arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
