(*---
description: "Declaring @ as a VARIABLE is a semantic error."
ref: "tla2sany/semantic/Generator.java#processVariables"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE at_as_variable ----
VARIABLE @
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 10 of module at_as_variable
    | Attempted to declare '@' as a variable.
    3002:1 Parsing or semantic analysis failed.
---*)
