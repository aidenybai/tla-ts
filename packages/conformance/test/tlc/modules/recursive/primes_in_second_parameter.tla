(*---
description: A recursive operator may not prime any parameter.
ref: "tla2sany/semantic/ModuleNode.java#levelCheck"
features: [recursive]
outcome: parse-error
---*)
---- MODULE primes_in_second_parameter ----
RECURSIVE F(_, _)
F(a, b) == b'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 13 of module primes_in_second_parameter
    | Argument 2 of recursive operator F is primed
    3002:1 Parsing or semantic analysis failed.
---*)
