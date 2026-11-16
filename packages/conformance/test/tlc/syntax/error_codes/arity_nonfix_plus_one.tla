(*---
description: 4204 fires for + applied to one argument in nonfix form.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_nonfix_plus_one ----
EXTENDS Naturals
A == +(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 9 of module arity_nonfix_plus_one
    | The operator + requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
