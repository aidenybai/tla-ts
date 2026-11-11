(*---
description: "4261 fires for @ in an ASSUME."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE at_in_assume ----
ASSUME @
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 8 to line 8, col 8 of module at_in_assume
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
