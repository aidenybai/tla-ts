(*---
description: "A declaration from the instanced module's extended module also needs a substitution."
ref: "tla2sany/semantic/SubstInNode.java#matchAll"
features: [instance]
outcome: parse-error
---*)
---- MODULE missing_declared_by_extendee ----
---- MODULE J ----
CONSTANT c
====
---- MODULE I ----
EXTENDS J
====
INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 1 to line 14, col 10 of module missing_declared_by_extendee
    | Substitution missing for symbol c declared at line 9, col 10 to line 9, col 10 of module missing_declared_by_extendee 
    | and instantiated in module missing_declared_by_extendee.
    3002:1 Parsing or semantic analysis failed.
---*)
