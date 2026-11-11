(*---
description: "A function has arity zero, so an arity-1 declaration mismatches."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_arity_function ----
RECURSIVE f(_)
f[x \in {1}] == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 1 to line 9, col 17 of module recursive_arity_function
    | Function f has operator arguments in its RECURSIVE declaration.
    | line 8, col 11 to line 8, col 14 of module recursive_arity_function
    | Symbol f declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
