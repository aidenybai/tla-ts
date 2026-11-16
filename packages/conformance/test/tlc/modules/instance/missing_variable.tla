(*---
description: A variable also needs a substitution.
ref: "tla2sany/semantic/SubstInNode.java#matchAll"
features: [instance]
outcome: parse-error
---*)
---- MODULE missing_variable ----
---- MODULE I ----
VARIABLE v
====
INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 10 of module missing_variable
    | Substitution missing for symbol v declared at line 9, col 10 to line 9, col 10 of module missing_variable 
    | and instantiated in module missing_variable.
    3002:1 Parsing or semantic analysis failed.
---*)
