(*---
description: "!2 does not exist on a unary application."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE second_on_unary ----
Op == ~TRUE
ASSUME Op!2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module second_on_unary
    | Nonexistent operand specified by `argument selector 2'.
    3002:1 Parsing or semantic analysis failed.
---*)
