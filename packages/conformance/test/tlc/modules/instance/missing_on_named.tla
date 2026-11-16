(*---
description: A named instance must have every declaration substituted.
ref: "tla2sany/semantic/SubstInNode.java#matchAll"
features: [instance]
outcome: parse-error
---*)
---- MODULE missing_on_named ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 15 of module missing_on_named
    | Substitution missing for symbol c declared at line 9, col 10 to line 9, col 10 of module missing_on_named 
    | and instantiated in module missing_on_named.
    3002:1 Parsing or semantic analysis failed.
---*)
