(*---
description: "A user definition of @ is never reachable because a use of @ is checked as an EXCEPT reference first."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE at_definition_not_usable ----
@ == 1
ASSUME @ = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 8 of module at_definition_not_usable
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
