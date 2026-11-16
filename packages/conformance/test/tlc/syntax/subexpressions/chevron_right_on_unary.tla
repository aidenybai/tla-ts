(*---
description: "!>> does not pick the operand of a unary application."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE chevron_right_on_unary ----
Op == ~TRUE
ASSUME Op!>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 12 of module chevron_right_on_unary
    | Nonexistent operand specified by `>>'.
    3002:1 Parsing or semantic analysis failed.
---*)
