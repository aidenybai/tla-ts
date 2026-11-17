(*---
description: "'(1, 2) applies the prime in nonfix form to two arguments, so it reports the prime's arity."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [operators]
outcome: parse-error
---*)
---- MODULE prime_nonfix_two_arguments ----
Test == '(1, 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 15 of module prime_nonfix_two_arguments
    | The operator ' requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
