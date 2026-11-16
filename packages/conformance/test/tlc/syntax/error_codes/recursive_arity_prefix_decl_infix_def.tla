(*---
description: A prefix declaration is not satisfied by an infix definition of the same symbol.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_arity_prefix_decl_infix_def ----
RECURSIVE -. _
a - b == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 11 to line 8, col 14 of module recursive_arity_prefix_decl_infix_def
    | Symbol -. declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
