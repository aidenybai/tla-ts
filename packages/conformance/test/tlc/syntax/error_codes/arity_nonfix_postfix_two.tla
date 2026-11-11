(*---
description: 4204 fires for a postfix operator applied to two arguments in nonfix form.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_nonfix_postfix_two ----
a ^+ == 1
A == ^+(1, 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 13 of module arity_nonfix_postfix_two
    | The operator ^+ requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
